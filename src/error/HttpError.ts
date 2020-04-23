export class HttpError extends Error {
    code: number;

    constructor(code: number, message: string) {
        super(message);
        this.code = code;

        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, this.constructor);
        } else {
            this.stack = (new Error(message)).stack;
        }
    }
}