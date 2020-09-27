import { HttpError } from './HttpError';

export class Forbidden extends HttpError {
    name = 'Forbidden';

    constructor(message: string) {
        super(403, message);
    }
}
