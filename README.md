# humio-winston <a href="https://www.npmjs.com/package/humio-winston"><img src="https://img.shields.io/npm/v/humio-winston.svg" alt="" /></a> [![Build Status](https://dev.azure.com/vladmarica/humio-winston/_apis/build/status/humio-winston-tests?branchName=master)](https://dev.azure.com/vladmarica/humio-winston/_build/latest?definitionId=9&branchName=master)

A simple transport for sending logs to [Humio](https://www.humio.com/) using the [Winston](https://github.com/winstonjs/winston) logger.

## Installation
```
npm install --save humio-winston
```

## Examples
```javascript
import winston from 'winston';
import HumioTransport from 'humio-winston';

const logger = winston.createLogger({
    format: winston.format.simple(),
    transports: [
        // The only required option is your Humio injest token
        new HumioTransport({
            injestToken: '<YOUR INJEST TOKEN HERE>'
        }),
    ],
});

logger.info('Hello, world!');
```

You can also apply tags to all logs sent to Humio through the transport. See the [Humio docs for more information about tags](https://docs.humio.com/operations-guide/parsers/tagging/).

```javascript
new HumioTransport({
    injestToken: '<YOUR  INJEST TOKEN HERE>',
    tags: {
        app: 'example',
    },
})
```

You can set a logging level to the Humio transport that overrides the logger's level. This is useful when you only want to send logs at or above a certain level and send more verbose logs elsewhere.

```javascript
const logger = winston.createLogger({
    level: 'debug', // By default, all transports log at the 'debug' level
    transports: [
        new winston.transports.Console(),
        new HumioTransport({
            level: 'info', // Only send logs that are 'info' or above to Humio  
            injestToken: '<YOUR HUMIO INJEST TOKEN HERE>',
        }),
    ],
});
```