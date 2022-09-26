const Search = require('../src/search');
const nock = require('nock');
nock.disableNetConnect();

function createClient(extraConfig = {}) {
  return new Search({
    accessId: 'foo',
    accessKey: 'bar',
    endpoint: 'https://api.jp.sumologic.com/api/v1/',
    ...extraConfig
  });
}

describe('constructor()', () => {
  test('yells if no access id', () => {
    expect(() => {
      new Search({
        accessKey: 'foo',
        endpoint: 'bar'
      });
    }).toThrow(/accessId/);
  });
  test('yells if no access key', () => {
    expect(() => {
      new Search({
        accessId: 'foo',
        endpoint: 'bar'
      });
    }).toThrow(/accessKey/);
  });
  test('yells if no endpoint', () => {
    expect(() => {
      new Search({
        accessId: 'foo',
        accessKey: 'bar'
      });
    }).toThrow(/endpoint/);
  });
});

describe('_getBasicAuthSecret()', () => {
  test('it works correctly', () => {
    const client = new Search({
      accessId: 'foo',
      accessKey: 'bar',
      endpoint: 'baz'
    });
    expect(client._getBasicAuthSecret()).toBe('Zm9vOmJhcg==');
  });
});

describe('request()', () => {
  beforeEach(() => {
    if (!nock.isActive()) {
      nock.activate();
    }
  });

  afterEach(() => {
    nock.restore();
  });

  test('it works correctly', async () => {
    const client = createClient();
    const params = {
      method: 'post',
      url: '/search/jobs',
      data: { from: 'foo', to: 'bar' }
    };
    nock('https://api.jp.sumologic.com/api/v1/')
      .post('/search/jobs', JSON.stringify(params.data))
      .matchHeader('Content-Type', 'application/json')
      .matchHeader('Authorization', 'Basic Zm9vOmJhcg==')
      .reply(200, 'success');
    await expect(client.request(params)).resolves.toHaveProperty('data', 'success');
  });

  test.each([401, 403])('it does not retry on %i', async (code) => {
    const client = createClient();
    const params = {
      method: 'post',
      url: '/search/jobs',
      data: { from: 'foo', to: 'bar' }
    };
    await nock('https://api.jp.sumologic.com/api/v1/')
      .post('/search/jobs')
      .reply(code);
    await expect(client.request(params)).rejects.toThrow(/Got a 4[0-9]{2} response from Sumo Logic API/);
  });

  test('it will retry forever for 429 errors', async () => {
    const retryCount = 1;
    const client = createClient({ retryDelay: 1, retryCount });
    const params = {
      method: 'post',
      url: '/search/jobs',
      data: { from: 'foo', to: 'bar' }
    };
    nock('https://api.jp.sumologic.com/api/v1/').post('/search/jobs').times(10).reply(429);
    nock('https://api.jp.sumologic.com/api/v1/').post('/search/jobs').reply(200, 'success'); // succeed eventually
    await expect(client.request(params)).resolves.toHaveProperty('data', 'success');
  });

  test.each([400, 500, 503])('it succeeds before N retries on %i', async (code) => {
    const retryCount = 3;
    const client = createClient({ retryDelay: 1, retryCount });
    const params = {
      method: 'post',
      url: '/search/jobs',
      data: { from: 'foo', to: 'bar' }
    };
    nock('https://api.jp.sumologic.com/api/v1/').post('/search/jobs').times(retryCount).reply(code);
    nock('https://api.jp.sumologic.com/api/v1/').post('/search/jobs').reply(200, 'success'); // succeed eventually
    await expect(client.request(params)).resolves.toHaveProperty('data', 'success');
  });

  test.each([400, 500, 503])('it fails after N retries on %i', async (code) => {
    const retryCount = 3;
    const client = createClient({ retryDelay: 1, retryCount });
    const params = {
      method: 'post',
      url: '/search/jobs',
      data: { from: 'foo', to: 'bar' }
    };
    nock('https://api.jp.sumologic.com/api/v1/').post('/search/jobs').times(retryCount + 1).reply(code);
    await expect(client.request(params)).rejects.toThrow(/Exceeded retry count/);
  });
});

describe('search()', () => {
  beforeEach(() => {
    if (!nock.isActive()) {
      nock.activate();
    }
  });

  afterEach(() => {
    nock.restore();
  });

  test('it works to get messages correctly', async () => {
    // TODO
    // is there anything better than this?
    const requests = require('./fixtures/00.js');
    requests.forEach((req) => {
      const urlAndBody = [req.path];
      if (req.method === 'POST') {
        urlAndBody.push(JSON.stringify(req.body));
      }
      nock('https://api.jp.sumologic.com/')[req.method.toLowerCase()](...urlAndBody)
        .reply(...[req.status, req.response]);
    });

    const client = createClient({ pollingDelay: 1 });
    const searchParams = {
      query: 'sample_query',
      from: '2019-06-25T10:14:31+09:00',
      to: '2019-06-25T17:14:31+09:00'
    };
    const iterator = await client.getMessageIterator(searchParams);
    for await (const response of iterator) {
      expect(response.state).toEqual({
        state: 'DONE GATHERING RESULTS',
        histogramBuckets: [
          {
            startTimestamp: 1561425300000,
            length: 300000,
            count: 576
          },
          {
            startTimestamp: 1561425271000,
            length: 29000,
            count: 78
          }
        ],
        messageCount: 3,
        recordCount: 0,
        pendingWarnings: [],
        pendingErrors: []
      });
      expect(response.results).toEqual({
        fields: [
          {
            name: 'sample-field',
            fieldType: 'long',
            keyField: false
          }
        ],
        messages: [
          {
            map: {
              msg: 'message1'
            }
          },
          {
            map: {
              msg: 'message2'
            }
          },
          {
            map: {
              msg: 'message3'
            }
          }
        ]
      });
    }
  });

  test('it respects the byReceiptTime parameter', async () => {
    const requests = require('./fixtures/01.js');
    requests.forEach((req) => {
      const urlAndBody = [req.path];
      if (req.method === 'POST') {
        urlAndBody.push(JSON.stringify(req.body));
      }
      nock('https://api.jp.sumologic.com/')[req.method.toLowerCase()](...urlAndBody)
        .reply(...[req.status, req.response]);
    });

    const client = createClient({ pollingDelay: 1 });
    const searchParams = {
      query: 'sample_query',
      from: '2019-06-25T10:14:31+09:00',
      to: '2019-06-25T17:14:31+09:00',
      byReceiptTime: true
    };
    const iterator = await client.getMessageIterator(searchParams);
    for await (const response of iterator) {
      expect(response.state).toEqual({
        state: 'DONE GATHERING RESULTS',
        histogramBuckets: [
          {
            startTimestamp: 1561425300000,
            length: 300000,
            count: 576
          },
          {
            startTimestamp: 1561425271000,
            length: 29000,
            count: 78
          }
        ],
        messageCount: 3,
        recordCount: 0,
        pendingWarnings: [],
        pendingErrors: []
      });
      expect(response.results).toEqual({
        fields: [
          {
            name: 'sample-field',
            fieldType: 'long',
            keyField: false
          }
        ],
        messages: [
          {
            map: {
              msg: 'message1'
            }
          },
          {
            map: {
              msg: 'message2'
            }
          },
          {
            map: {
              msg: 'message3'
            }
          }
        ]
      });
    }
  });

  test('it works to get records correctly', async () => {
    // TODO
    // is there anything better than this?
    const requests = require('./fixtures/02.js');
    requests.forEach((req) => {
      const urlAndBody = [req.path];
      if (req.method === 'POST') {
        urlAndBody.push(JSON.stringify(req.body));
      }
      nock('https://api.jp.sumologic.com/')[req.method.toLowerCase()](...urlAndBody)
        .reply(...[req.status, req.response]);
    });

    const client = createClient({ pollingDelay: 1 });
    const searchParams = {
      query: 'sample_query',
      from: '2019-06-25T10:14:31+09:00',
      to: '2019-06-25T17:14:31+09:00'
    };
    const iterator = await client.getRecordIterator(searchParams);
    for await (const response of iterator) {
      expect(response.state).toEqual({
        state: 'DONE GATHERING RESULTS',
        histogramBuckets: [
          {
            startTimestamp: 1561425300000,
            length: 300000,
            count: 576
          },
          {
            startTimestamp: 1561425271000,
            length: 29000,
            count: 78
          }
        ],
        messageCount: 3,
        recordCount: 3,
        pendingWarnings: [],
        pendingErrors: []
      });
      expect(response.results).toEqual({
        fields: [
          {
            name: 'sample-field',
            fieldType: 'long',
            keyField: false
          }
        ],
        records: [
          {
            "map": {
              "_count": "1",
              "key": "aggregation key1",
            }
          },
          {
            "map": {
              "_count": "2",
              "key": "aggregation key2",
            }
          },
          {
            "map": {
              "_count": "3",
              "key": "aggregation key3",
            }
          }
        ]
      });
    }
  });
});
