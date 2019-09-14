import winston from 'winston'
import HumioTransport, { HumioTransportOptions, HumioError } from '../src/humio-winston';
import waitForExpect from 'wait-for-expect';

const HUMIO_INGEST_TOKEN = process.env.HUMIO_INGEST_TOKEN;
if (!HUMIO_INGEST_TOKEN) {
    console.log('You must set the HUMIO_INGEST_TOKEN environment variable');
    process.exit(1);
}

interface CreateLoggerResult {
    logger: winston.Logger;
    transport: HumioTransport;
}

function createLogger(defaultLevel: string = 'info', options?: Partial<HumioTransportOptions>): CreateLoggerResult {
    const defaultOptions: HumioTransportOptions = { level: defaultLevel, ingestToken: '' };
    const humioTransport = new HumioTransport(
        options ? Object.assign({}, defaultOptions, options) : defaultOptions);

    return {
        logger: winston.createLogger({
            level: defaultLevel,
            transports: [humioTransport],
        }),
        transport: humioTransport
    };
}

describe('testing sending logs to Humio', () => {
    it('should succeed given valid ingest token', async (done) => {
        const callback = jest.fn();
        const logger = createLogger('info', {
            ingestToken: HUMIO_INGEST_TOKEN,
            callback: callback
        }).logger;
        logger.info('Test log from humio-winston');

        await waitForExpect(() => {
            expect(callback).toBeCalledTimes(1);
        });

        expect(callback.mock.calls[0].length).toBe(0);
        done();
    });

    it('should succeed with tags given valid ingest token', async (done) => {
        const callback = jest.fn();
        const logger = createLogger('info', {
            ingestToken: HUMIO_INGEST_TOKEN,
            tags: {
                app: 'humion-winston-test'
            },
            callback: callback
        }).logger;
        logger.info('Test log from humio-winston (with tag)');

        await waitForExpect(() => {
            expect(callback).toBeCalledTimes(1);
        });

        expect(callback.mock.calls[0].length).toBe(0);
        done();
    });

    it('should fail given invalid ingest token', async (done) => {
        const callback = jest.fn();
        const logger = createLogger('info', { callback: callback }).logger;
        logger.info('Test log from humio-winston (should not be sent)');

        await waitForExpect(() => {
            expect(callback).toBeCalledTimes(1);
        });

        expect(callback.mock.calls[0][0]).toBeInstanceOf(HumioError);
        const error: HumioError = callback.mock.calls[0][0];
        expect(error.code).toBe(401);
        done();
    });
});
