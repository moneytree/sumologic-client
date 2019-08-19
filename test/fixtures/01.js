module.exports = [{
  scope: 'https://api.jp.sumologic.com:443',
  method: 'POST',
  path: '/api/v1/search/jobs',
  body: {
    query: 'sample_query',
    from: '2019-06-25T10:14:31+09:00',
    to: '2019-06-25T17:14:31+09:00',
    timeZone: 'Asia/Tokyo',
    byReceiptTime: 'true'
  },
  status: 202,
  response: {
    id: '750D3ABE4460BA73',
    link: {
      rel: 'self',
      href: 'https://api.jp.sumologic.com/api/v1/search/jobs/750D3ABE4460BA73'
    }
  },
  rawHeaders: [
    'Date',
    'Wed, 10 Jul 2019 04:10:36 GMT',
    'Content-Type',
    'application/json',
    'Transfer-Encoding',
    'chunked',
    'Connection',
    'close',
    'Set-Cookie',
    'AWSALB=Pxmydyk+9LMvAEfZH2h55jJve2ufmwdneWqzPcrul85wJo8SD0DoFmSBQIDhde3Sv1rp4Z/D3JXi7l0MLGtr0e1IhE6XhN8ihEAQoMPtEcPrJCRi7EYX0AJCS/03; Expires=Wed, 17 Jul 2019 04:10:36 GMT; Path=/',
    'Cache-Control',
    'no-cache, no-store, max-age=0, must-revalidate',
    'Pragma',
    'no-cache',
    'Expires',
    'Thu, 01 Jan 1970 00:00:00 GMT',
    'X-XSS-Protection',
    '1; mode=block',
    'X-Frame-Options',
    'DENY',
    'X-Content-Type-Options',
    'nosniff',
    'Set-Cookie',
    'JSESSIONID=node0z8u0k92qywg3ek8wy6br6dj2843.node0; Path=/api',
    'Location',
    'https://api.jp.sumologic.com/api/v1/search/jobs/750D3ABE4460BA73'
  ]
},
{
  scope: 'https://api.jp.sumologic.com:443',
  method: 'GET',
  path: '/api/v1/search/jobs/750D3ABE4460BA73',
  body: '',
  status: 200,
  response: {
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
  },
  rawHeaders: [
    'Date',
    'Wed, 10 Jul 2019 04:10:36 GMT',
    'Content-Type',
    'application/json;charset=utf-8',
    'Transfer-Encoding',
    'chunked',
    'Connection',
    'close',
    'Set-Cookie',
    'AWSALB=G6vGpwo8A/C1Zu+1IpQU3WVBpYJqr+JToBZ0+s8l3EPYaePY5gVHxz8IJUTa1Mf/YdJnS09GFLakCjPP3v4z5CAqyObDcQTWUb+UI8ddmyxFEuSt+C7A8xApOZlm; Expires=Wed, 17 Jul 2019 04:10:36 GMT; Path=/',
    'Cache-Control',
    'no-cache, no-store, max-age=0, must-revalidate',
    'Pragma',
    'no-cache',
    'Expires',
    'Thu, 01 Jan 1970 00:00:00 GMT',
    'X-XSS-Protection',
    '1; mode=block',
    'X-Frame-Options',
    'DENY',
    'X-Content-Type-Options',
    'nosniff',
    'Set-Cookie',
    'JSESSIONID=node0shrdo704xzmy1sgazlho1l8z42840.node0; Path=/api',
    'Vary',
    'Accept-Encoding, User-Agent'
  ]
}, {
  scope: 'https://api.jp.sumologic.com:443',
  method: 'GET',
  path: '/api/v1/search/jobs/750D3ABE4460BA73/messages?offset=0&limit=50000',
  body: '',
  status: 200,
  response: {
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
  },
  rawHeaders: [
    'Date',
    'Wed, 10 Jul 2019 04:10:36 GMT',
    'Content-Type',
    'application/json;charset=utf-8',
    'Transfer-Encoding',
    'chunked',
    'Connection',
    'close',
    'Set-Cookie',
    'AWSALB=TwtM7wDsw4K/kc52LbyjxJZNENNUeDU/t0/9NVDxUU/0EqLuCyor/Ym9eevsol1hl8BTFVnuVEIGxdkgM0mqzDEUHARpwhHjl8axm8NKxpJFYV+BMU9lyuLbMdXo; Expires=Wed, 17 Jul 2019 04:10:36 GMT; Path=/',
    'Cache-Control',
    'no-cache, no-store, max-age=0, must-revalidate',
    'Pragma',
    'no-cache',
    'Expires',
    'Thu, 01 Jan 1970 00:00:00 GMT',
    'X-XSS-Protection',
    '1; mode=block',
    'X-Frame-Options',
    'DENY',
    'X-Content-Type-Options',
    'nosniff',
    'Set-Cookie',
    'JSESSIONID=node013d6vnkzzyjexr2dcnemtws1d2841.node0; Path=/api',
    'Vary',
    'Accept-Encoding, User-Agent'
  ]
}, {
  scope: 'https://api.jp.sumologic.com:443',
  method: 'DELETE',
  path: '/api/v1/search/jobs/750D3ABE4460BA73',
  body: '',
  status: 200,
  response: {
    id: '750D3ABE4460BA73'
  },
  rawHeaders: [
    'Date',
    'Wed, 10 Jul 2019 04:10:37 GMT',
    'Content-Type',
    'application/json;charset=utf-8',
    'Transfer-Encoding',
    'chunked',
    'Connection',
    'close',
    'Set-Cookie',
    'AWSALB=lmcUMXglhcyc2AeVaWGWPZB9eWMxQ8VEJHBgZlUuqa37n5yLlvp01+7LL2Z8ghzQkm7CxmBlzW3u+Anhi5HwJIuMeJ/hDQFpM5Xw2dJNynVWe8sR0xO4QuR5yU4B; Expires=Wed, 17 Jul 2019 04:10:37 GMT; Path=/',
    'Cache-Control',
    'no-cache, no-store, max-age=0, must-revalidate',
    'Pragma',
    'no-cache',
    'Expires',
    'Thu, 01 Jan 1970 00:00:00 GMT',
    'X-XSS-Protection',
    '1; mode=block',
    'X-Frame-Options',
    'DENY',
    'X-Content-Type-Options',
    'nosniff',
    'Set-Cookie',
    'JSESSIONID=node0mkt2s73n3p8umrb4rofhd25a2842.node0; Path=/api'
  ]
}];
