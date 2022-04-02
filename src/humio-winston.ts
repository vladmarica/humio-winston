import Transport, { TransportStreamOptions } from 'winston-transport';
import fetch from 'node-fetch';

const API_BASE_URL = 'https://cloud.humio.com';
const UNSTRUCTURE_API_ENDPOINT = '/api/v1/ingest/humio-unstructured';

export interface HumioTransportOptions extends TransportStreamOptions {
    ingestToken: string;

    /**
     * Specify a specific URL for the Humio service.
     * Default is https://cloud.humio.com. 
     * For community use https://cloud.community.humio.com.
     */
    apiBaseUrl?: string;
    callback?: (err?: Error) => void;
    tags?: { [key: string]: string }
}

export class HumioError extends Error {
    constructor(message: string, public code: number) {
        super(message);
    }
}

export default class HumioTransport extends Transport {
    private options: HumioTransportOptions;
    private readonly apiBaseUrl: string;

    constructor(options: HumioTransportOptions) {
        super(options);
        this.options = options;
        this.apiBaseUrl = options.apiBaseUrl || API_BASE_URL;
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
        this.sendIngestRequest(UNSTRUCTURE_API_ENDPOINT, [body]);

        callback();
    }

    private async sendIngestRequest(endpoint: string, requestBody: any) {
        try {
            const res = await fetch(this.apiBaseUrl + endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + this.options.ingestToken,
                },
                body: JSON.stringify(requestBody)
            });

            if (this.options.callback) {
                if (res.status >= 400) {
                    const text = await res.text();
                    this.options.callback(new HumioError(text, res.status));
                }
                else {
                    this.options.callback();
                }
            }
        }
        catch (err) {
            if (this.options.callback) {
                this.options.callback(err);
            }
        }
    }
}
