const axios = require('axios');
const moment = require('moment');
require('moment-timezone');
const debug = require('debug');

const log = debug('sumologic-search');

class Search {
  get config() {
    return this._config;
  }

  constructor(config) {
    if (!config.hasOwnProperty('accessId')) {
      throw new Error('Please pass in accessId');
    }

    if (!config.hasOwnProperty('accessKey')) {
      throw new Error('Please pass in accessKey');
    }

    if (!config.hasOwnProperty('endpoint')) {
      throw new Error('Please pass in endpoint');
    }

    config.retryDelay = config.retryDelay || Search.CFG_DEFAULT_RETRY_DELAY;
    config.retryCount = config.retryCount || Search.CFG_DEFAULT_RETRY_COUNT;
    config.timezone = config.timezone || Search.CFG_DEFAULT_TIMEZONE;
    config.searchPageLimit = config.searchPageLimit || Search.CFG_DEFAULT_PAGE_LIMIT;
    config.pollingDelay = config.pollingDelay || Search.CFG_DEFAULT_POLLING_DELAY;

    this._config = config;
  }

  async request(params) {
    const headers = params.headers || {};
    headers['Content-Type'] = 'application/json';
    headers.Authorization = `Basic ${this._getBasicAuthSecret()}`;

    params.headers = headers;
    params.baseURL = this.config.endpoint;
    params.validateStatus = () => true;
    params.transformRequest = (data) => JSON.stringify(data);

    let remainingRetries = this.config.retryCount;

    log(`requesting ${JSON.stringify(params)}`);

    while (true) {
      let response;

      try {
        // TODO
        // use axios.create
        response = await axios.request(params);
      } catch (e) {
        log(`request error: ${e.message}`);
        if (!e.status && remainingRetries > 0) {
          log('network error, retrying');
          remainingRetries--;
          await Search._wait(this.config.retryDelay);
          continue;
        } else {
          log('ran out of retry attempts');
          throw e;
        }
      }

      log(`response code=${response.status}`);

      // NOTE
      // Error handling won't work properly in the browser because they
      // do not include CORS headers in case of non-2xx responses.
      if (response.status === 429 || response.status === 504) {
        // rate limit exceeded, or gateway timeout: always retry
        log('got 429/504, retrying');
        await Search._wait(this.config.retryDelay);
        continue;
      }

      if (response.status === 500 || response.status === 503) {
        // backend error, or service unavailable: retry
        if (remainingRetries > 0) {
          log('got 500/503, retrying');
          await Search._wait(this.config.retryDelay);
          remainingRetries--;
          continue;
        } else {
          log('ran out of retry attempts');
          throw new Error('Exceeded retry count for 500/503 errors.');
        }
      }

      if (response.status >= 400) {
        log(`got ${response.status} from server, failing immediately`);
        const error = new Error('A 4xx response from Sumo Logic API. Debug the' +
                                'attached `response` object for reference.');
        error.response = response;
        throw error;
      }

      return response;
    }
  }

  async newSearchJob(queryParams) {
    log('newSearchJob');

    queryParams.timeZone = queryParams.timeZone || this.config.timezone;
    queryParams.from = moment(queryParams.from).tz(this.config.timezone).format();
    queryParams.to = moment(queryParams.to).tz(this.config.timezone).format();

    const requestParams = {
      method: 'post',
      url: '/search/jobs',
      data: queryParams
    };

    const response = await this.request(requestParams);

    return response.data.id;
  }

  async getJobState(id) {
    log('getJobState');

    const requestParams = {
      method: 'get',
      url: `/search/jobs/${id}`
    };

    const response = await this.request(requestParams);

    return response.data;
  }

  /**
   * Gets results gathered so far, from a given offset. This does not take the current job state
   * into consideration. E.g. this method may be called when results are still being gathered, in
   * which case this method will return results gathered **so far**. If you call this while the
   * results are still being gathered, be sure to call this again with the corresponding offset.
   */
  async getJobResults(id, offset = 0) {
    log('getJobResults');

    const requestParams = {
      method: 'get',
      url: `/search/jobs/${id}/messages?offset=${offset}&limit=${this.config.searchPageLimit}`
    };

    const response = await this.request(requestParams);

    return response.data;
  }

  async deleteSearchJob(id) {
    log('deleteSearchJob');

    const requestParams = {
      method: 'delete',
      url: `/search/jobs/${id}`
    };
    await this.request(requestParams);
  }

  cancel() {
    // eslint-disable-next-line no-new-object
    this._nonce = new Object();
  }

  async *getIterator(queryParams) {
    const jobId = await this.newSearchJob(queryParams);
    let myNonce;

    // eslint-disable-next-line no-new-object
    this._nonce = myNonce = new Object();

    let resultsGatheredSoFar = 0;
    let state = null;

    while (true) {
      if (this._nonce !== myNonce) {
        log('another operation has been started, canceling search');
        await this.deleteSearchJob(jobId);
        throw new Search.ERROR_SEARCH_CANCELED();
      }

      // refresh the state, unless already done gathering results:
      if (!(state && state.state === Search.STATE_DONE_GATHERING_RESULTS)) {
        state = await this.getJobState(jobId);
        log(`state=${state.state}, cnt=${state.messageCount}`);
      }

      if (state.state === Search.STATE_NOT_STARTED) {
        // not started yet, wait for a while
        log('job not started yet');
        await Search._wait(this.config.pollingDelay);
        continue;
      }

      if (state.state === Search.STATE_CANCELED) {
        log('job has been canceled');
        throw new Error('Search job has been canceled unexpectedly.');
      }

      if (state.state === Search.STATE_FORCE_PAUSED) {
        log('job has been force paused');
        throw new Error('Search job has been force paused. This behavior is currently not supported.');
      }

      const results = await this.getJobResults(jobId, resultsGatheredSoFar);

      yield { state, results };

      resultsGatheredSoFar += results.messages.length;
      log(`gathered so far: ${resultsGatheredSoFar}`);

      if (state.state === Search.STATE_DONE_GATHERING_RESULTS) {
        if (state.messageCount === resultsGatheredSoFar) {
          log('job done gathering results, and we downloaded everything; wrapping up');
          await this.deleteSearchJob(jobId);
          return;
        }
        log('job done gathering results, but we are still downloading them');
      } else {
        log('sumologic is still gathering results, waiting a bit and polling again');
        await Search._wait(this.config.pollingDelay);
      }
    }
  }

  _getBasicAuthSecret() {
    // eslint-disable-next-line no-undef
    let btoa = typeof window === 'undefined' ? undefined : window.btoa;
    if (typeof Buffer !== 'undefined') {
      btoa = (str) => Buffer.from(str, 'utf8').toString('base64');
    }

    const secret = btoa(`${this.config.accessId}:${this.config.accessKey}`);

    return secret;
  }

  static _wait(waitms) {
    return new Promise((resolve) => {
      setTimeout(resolve, waitms);
    });
  }
}

// default configuration keys:
Search.CFG_DEFAULT_RETRY_DELAY = 1000;
Search.CFG_DEFAULT_RETRY_COUNT = 3;
Search.CFG_DEFAULT_TIMEZONE = 'Asia/Tokyo';
Search.CFG_DEFAULT_POLLING_DELAY = 1000;
Search.CFG_DEFAULT_PAGE_LIMIT = 50000;

// search job states;
Search.STATE_GATHERING_RESULTS = 'GATHERING RESULTS';
// Search job has not been started yet.
Search.STATE_NOT_STARTED = 'NOT STARTED';
// Query that is paused by the system. It is true only for non-aggregate queries that are paused at the limit of 100k.
// This limit is dynamic and may vary from customer to customer.
Search.STATE_FORCE_PAUSED = 'FORCE PAUSED';
Search.STATE_DONE_GATHERING_RESULTS = 'DONE GATHERING RESULTS';
// The search job has been canceled. Note the spelling has two L letters.
Search.STATE_CANCELED = 'CANCELLED';

// endpoints
Search.ENDPOINT_JP = 'https://api.jp.sumologic.com/api/v1/';

// errors
Search.ERROR_SEARCH_CANCELED = class SearchCanceledError extends Error {
  constructor() {
    super('Search has been canceled.');
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
};

module.exports = Search;
