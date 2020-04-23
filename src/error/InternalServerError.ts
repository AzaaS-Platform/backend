import {HttpError} from "./HttpError";

export class InternalServerError extends HttpError {

    name = "Internal Server Error";

    constructor(message: string) {
        super(500, message);
    }
}