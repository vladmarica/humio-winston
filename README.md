# humio-winston <a href="https://www.npmjs.com/package/humio-winston"><img src="https://img.shields.io/npm/v/humio-winston.svg" alt="" /></a> [![Build Status](https://dev.azure.com/vladmarica/humio-winston/_apis/build/status/humio-winston-tests?branchName=master)](https://dev.azure.com/vladmarica/humio-winston/_build/latest?definitionId=9&branchName=master)

A simple transport for sending logs to [Humio](https://www.humio.com/) using the [Winston](https://github.com/winstonjs/winston) logger.

## Installation
```
npm install --save humio-winston
```

## Usage
```javascript
import winston from 'winston';
import HumioTransport from 'humio-winston';

const logger = winston.createLogger({
    format: winston.format.simple(),
    transports: [
        // The only required option is your Humio ingest token
        new HumioTransport({
            ingestToken: '<YOUR INGEST TOKEN HERE>'
        }),
    ],
});

logger.info('Hello, world!');
```

### Tags

You can also apply tags to all logs sent to Humio through the transport. See the [Humio docs for more information about tags](https://docs.humio.com/operations-guide/parsers/tagging/).

```javascript
new HumioTransport({
    ingestToken: '<YOUR INGEST TOKEN HERE>',
    tags: {
        app: 'example',
    },
})
```

### Logging Levels

You can set a logging level to the Humio transport that overrides the logger's level. This is useful when you only want to send logs at or above a certain level and send more verbose logs elsewhere.

```javascript
const logger = winston.createLogger({
    level: 'debug', // By default, all transports log at the 'debug' level
    transports: [
        new winston.transports.Console(),
        new HumioTransport({
            level: 'info', // Only send logs that are 'info' or above to Humio  
            ingestToken: '<YOUR INGEST TOKEN HERE>',
        }),
    ],
});
```

### Handling Errors
You can pass a callback to the `HumioTransport` constructor which will be called after each log is sent to Humio. The callback signature is:
```typescript
(err: Error | undefined) => void
```
If a log cannot be sent for whatever reason (such as a dropped network connection), the argument will be an `Error` containing the error message. On successful transmission, the argument will be `undefined`.

```javascript
const logCallback = err => {
    if (err) {
        console.error('Failed to send log to Humio: '+ err.message);
    }
};

const logger = winston.createLogger({
    transports: [
        new winston.transports.Console(),
        new HumioTransport({
            ingestToken: '<YOUR INGEST TOKEN HERE>',
            callback: logCallback,
        }),
    ],
});
```

## Running Tests
Some of the tests send real logs to Humio, meaning that they require a real ingest token. If you want to run the tests yourself, you should create an ingest token just for the test logs.

You must set the `HUMIO_INGEST_TOKEN` environment variable before running tests.
```
HUMIO_INGEST_TOKEN=abc123 npm run test
```