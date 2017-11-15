# node-amp-api 

`node-amp-api` is a node library that loads content into amp, updates amp cache, and validates urls against amp.

## Contents

* [Installation](#installation)
* [Usage](#usage)
* [Contributing](#contributing)

## Installation

```shell
npm i node-amp-api --save --save-exact
```

## Usage

Create an instance of AmpApi

``` javascript
const AmpApi = require('amp-api');

const ampApi = new AmpApi({
  // api key from google developer console
  apiKey: 'keyfromgooglecosole',
  // a logger that has info, warn, error, and fatal (defaults to console)
  log: logger, 
  // path on your file system to your private key
  keyPath: '/path-to/file-system/private-key.pem'
});
```

Validate a url, returns Promise

``` javascript
ampApi
  .validateAmpUrl(
    'https://fastcompany.com/40467645/how-pie-became-a-powerful-punchline-in-political-provocation'
  )
```  

Batch Get Urls to Load in Amp, returns Promise

``` javascript
ampApi
      .batchGet({
        lookupStrategy: 'FETCH_LIVE_DOC',
        urls: [
          'https://amp.fastcompany.com/40491026/james-corden-lives-in-the-moment-heres-how'
        ]
      })
```

Update google's cache, returns Promise

``` javascript
ampApi
    .updateCache(
        'https://amp.fastcompany.com/40491026/james-corden-lives-in-the-moment-heres-how'
    )

```

## Contributing

Open an issue.

Get an api key: 

https://console.developers.google.com/apis/dashboard

Follow google's directions on hosting the public key: 

https://developers.google.com/amp/cache/update-cache
 
Example here:

https://www.fastcompany.com/.well-known/amphtml/apikey.pub

Update local .env. 

Code, test, make a PR, reference the issue. 
