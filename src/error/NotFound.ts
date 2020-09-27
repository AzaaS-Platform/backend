import { HttpError } from './HttpError';

export class NotFound extends HttpError {
    name = 'Not Found';

    constructor(message: string) {
        super(404, message);
    }
}
