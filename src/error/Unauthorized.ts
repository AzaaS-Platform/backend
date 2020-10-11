import { HttpError } from './HttpError';

export class Unauthorized extends HttpError {
    name = 'Unauthorized';

    constructor(message: string) {
        super(401, message);
    }
}
