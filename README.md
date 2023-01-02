# sumologic-client

A JavaScript client for Sumo Logic APIs.

## Requirements

This library requires **NodeJS 10+** as it uses async iterators to stream chunks of data from Sumo Logic backend (see example below).

## Features

Only Search Job API is supported at the moment. Supported features:

-   Streams search results as they are gathered by Sumo Logic backend.
-   Notifies you of state changes on the backend ("Search started" → "Gathering results" → "Finished").
-   Handles "too many requests", and other errors on the backend.
-   Cleans up properly after search is done.

Not supported:

-  Aggregations
-  Metrics

## Install

```sh
$ npm install @moneytree/sumologic-client
```

## Prerequisites

You will need to obtain Sumo Logic access keys to use this library. Both user level and admin level access keys will work.

To create a user level access keys, go to your profile settings in Sumo Logic dashboard, and create a key in the *My Access Keys* section.

## Sample Use

```javascript
const { Search } = require('sumologic-client');
(async () => {
  const client = new Search({
    // client config (see below)
  });

  const searchParams = {
    query: '<sumologic_query>',
    // dates are ISO formatted
    from: '2019-06-25T10:14:31+09:00',
    to: '2019-06-25T17:14:31+09:00'
  };

  const it = await client.getMessageIterator(searchParams);

  for await (let response of it) {
      // check the latest backend state and total
      // number of results gathered so far:
      console.log(response.state);

      // new search results since the last iteration:
      console.log(response.results);
  }
})();
```

The config object passed to constructor can have the following options:

```js
{
  // [required] Your access ID
  accessId: '*******',

  // [required] Your access key
  accessKey: '*******',

  // [required] API endpoint as described here:
  // https://help.sumologic.com/APIs/General-API-Information/Sumo-Logic-Endpoints-and-Firewall-Security
  endpoint: 'https://api.**.sumologic.com/api/v*/',

  // In case of request error, how much time to wait (in ms) before trying again
  retryDelay: 1000, // default

  // In case of request error, how many times to retry
  retryCount: 3, // default

  // the `timeZone` parameter of Create Search Job API, as described here:
  // https://help.sumologic.com/APIs/Search-Job-API/About-the-Search-Job-API
  timezone: 'Asia/Tokyo', // default

  // the value `limit` parameter when paging through messages, as described here:
  // https://help.sumologic.com/APIs/Search-Job-API/About-the-Search-Job-API
  searchPageLimit: 50000, // default

  // if we are waiting for the backend to gather more results, this is the delay between
  // checking if new results are available
  pollingDelay: 1000 // default
}
```

## Limitations

Aside from features that are simply not yet implemented:

-  When using in the browser, there is no way to identify certain backend errors: such as 401 or 403. This is due to limitations of Sumo Logic backend: they will not return CORS headers for such responses, and browser will block these requests due to same-origin policy violation. This means that we can not check response status in the code, and API call will simply return to you as "Network Error".

## TODOs

-  Implement aggregations and metrics
-  Improve test coverage

## License

ISC
test
