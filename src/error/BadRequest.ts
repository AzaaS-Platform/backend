import { HttpError } from './HttpError';

export class BadRequest extends HttpError {
    name = 'Bad Request';

    constructor(message: string) {
        super(400, message);
    }
}
