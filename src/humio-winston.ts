import Transport, { TransportStreamOptions } from 'winston-transport';
import fetch from 'node-fetch';

const API_BASE_URL = 'https://cloud.humio.com';
const UNSTRUCTURE_API_ENDPOINT = '/api/v1/ingest/humio-unstructured';

export interface HumioTransportOptions extends TransportStreamOptions {
    injestToken: string;
    suppressErrors?: boolean; // If false, all errors are printed to stderr
    tags?: { [key: string]: string }
}

const defaultOptions: Partial<HumioTransportOptions> = {
    suppressErrors: true,
};

export default class HumioTransport extends Transport {
    private options: HumioTransportOptions;

    constructor(options: HumioTransportOptions) {
        super(options);
        this.options = Object.assign({}, defaultOptions, options);
    }

    public log(info: any, callback: () => void): any {
        setImmediate(() => this.emit('logged', info));

        const body: any = {
            messages: [JSON.stringify(info)],
        };

        // Add tags to the request if they are given
        if (this.options.tags) {
            body.tags = this.options.tags;
        }
        this.sendInjestRequest(UNSTRUCTURE_API_ENDPOINT, [body]);

        callback();
    }

    private sendInjestRequest(endpoint: string, requestBody: any) {
        fetch(API_BASE_URL + endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.options.injestToken,
            },
            body: JSON.stringify(requestBody)
        })
        .catch(err => !this.options.suppressErrors
            && console.error('Failed to send log to Humio: ' + JSON.stringify(err)));
    }
}
