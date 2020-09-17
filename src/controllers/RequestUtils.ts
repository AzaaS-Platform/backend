import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { HttpError } from '../error/HttpError';
import { BadRequest } from '../error/BadRequest';

export class RequestUtils {
    public static CLIENT = 'client';
    public static ID = 'id';

    static buildResponse(message: string): APIGatewayProxyResult {
        return {
            statusCode: 200,
            body: message,
        };
    }

    static handleError(error: Error): APIGatewayProxyResult {
        const code = (error as HttpError).code ?? 500;
        return {
            statusCode: code,
            body: `${error.stack}`,
        };
    }

    static extractQueryStringParameters(event: APIGatewayProxyEvent, names: Array<string>): Map<string, string> {
        const parameters = new Map<string, string>();

        names.forEach(it => {
            if (event.queryStringParameters === null) {
                throw new BadRequest('no query parameters passed');
            } else {
                if (event.queryStringParameters[it]) {
                    parameters.set(it, event.queryStringParameters[it]);
                } else {
                    throw new BadRequest(`parameter ${it} is required`);
                }
            }
        });
        return parameters;
    }

    static bindClient(event: APIGatewayProxyEvent): string {
        if (event.pathParameters === null || event.pathParameters[this.CLIENT] === undefined) {
            throw new BadRequest('client not passed');
        } else {
            return event.pathParameters[this.CLIENT];
        }
    }

    static bindId(event: APIGatewayProxyEvent): string {
        if (event.pathParameters === null || event.pathParameters[this.ID] === undefined) {
            throw new BadRequest('id not passed');
        } else {
            return event.pathParameters[this.ID];
        }
    }

    static parse<T extends Record<string, any>>(payload: string, schema: new () => T): T {
        const object = JSON.parse(payload);

        const allowed = [this.CLIENT, this.ID];
        const schemaKeys = Object.keys(new schema()).filter(it => !allowed.includes(it));
        const payloadKeys = Object.keys(object).filter(it => !allowed.includes(it));

        const missing = schemaKeys.filter(it => !payloadKeys.includes(it));
        const unrecognized = payloadKeys.filter(it => !schemaKeys.includes(it));

        if (missing.length === 0 && unrecognized.length === 0) {
            return object;
        } else {
            let error = '';
            if (missing.length > 0) error += 'missing fields: ' + missing + '\n';
            if (unrecognized.length > 0) error += 'unrecognized fields: ' + unrecognized + '\n';
            throw new BadRequest(error);
        }
    }
}
