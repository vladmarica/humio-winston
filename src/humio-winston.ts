import Transport from 'winston-transport';

export interface HumioTransportOptions extends Transport.TransportStreamOptions{
    injestKey: string;
}

export default class HumioTransport extends Transport {
    private injestKey: string;

    constructor(options: HumioTransportOptions) {
        super(options);
        this.injestKey = options.injestKey;    
    }

    public log(info: any, callback: () => void): any {
        setImmediate(() => this.emit('logged', info));

        callback();
    }
}
