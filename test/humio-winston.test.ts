import winston from 'winston'
import HumioTransport, { HumioTransportOptions, HumioError } from '../src/humio-winston';
import waitForExpect from 'wait-for-expect';

const HUMIO_INJEST_TOKEN = process.env.HUMIO_INJEST_TOKEN;
if (!HUMIO_INJEST_TOKEN) {
    console.log('You must set the HUMIO_INJEST_TOKEN environment variable');
    process.exit(1);
}

interface CreateLoggerResult {
    logger: winston.Logger;
    transport: HumioTransport;
}

function createLogger(defaultLevel: string = 'info', options?: Partial<HumioTransportOptions>): CreateLoggerResult {
    const defaultOptions: HumioTransportOptions = { level: defaultLevel, injestToken: '' };
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

async function sleep(ms: number): Promise<void> {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

describe('test transport functionality', () => {
    it('should emit once when called with proper level', async (done) => {
        const result = createLogger()
        const callback = jest.fn(() => {});

        result.transport.on('logged', callback);
        result.logger.info('Test log 1');

        await sleep(1000);
        expect(callback).toBeCalledTimes(1);
        done();
    });

    it('should not emit when called with level that\'s too low', async (done) => {
        const result = createLogger('info', { level: 'warn' })
        const callback = jest.fn(() => {});

        result.transport.on('logged', callback);
        result.logger.info('Test log 2');

        await sleep(1000);
        expect(callback).not.toBeCalled();
        done();
    });
});

describe('testing sending logs to Humio', () => {
    it('should succeed given valid injest token', async (done) => {
        const callback = jest.fn();
        const logger = createLogger('info', {
            injestToken: HUMIO_INJEST_TOKEN,
            callback: callback
        }).logger;
        logger.info('Test log from humio-winston');

        await waitForExpect(() => {
            expect(callback).toBeCalledTimes(1);
        });

        expect(callback.mock.calls[0].length).toBe(0);
        done();
    });

    it('should succeed with tags given valid injest token', async (done) => {
        const callback = jest.fn();
        const logger = createLogger('info', {
            injestToken: HUMIO_INJEST_TOKEN,
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

    it('should fail given invalid injest token', async (done) => {
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
