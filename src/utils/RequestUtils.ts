import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { HttpError } from '../error/HttpError';
import { BadRequest } from '../error/BadRequest';
import { Unauthorized } from '../error/Unauthorized';

const RESPONSE_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Method': '*',
    'Access-Control-Allow-Credentials': true,
    'Access-Control-Allow-Headers': '*',
    'Content-Type': 'application/json',
};

export class RequestUtils {
    public static CLIENT = 'client';
    public static ID = 'entity';

    static buildResponse(message: string, statusCode = 200, additionalHeaders: object = {}): APIGatewayProxyResult {
        return {
            statusCode: statusCode,
            headers: { ...additionalHeaders, ...RESPONSE_HEADERS },
            body: JSON.stringify({
                statusCode: statusCode,
                message: message,
                error: undefined,
            }),
        };
    }

    static buildResponseWithBody(
        responseBody: {},
        message?: string,
        statusCode = 200,
        additionalHeaders: object = {},
    ): APIGatewayProxyResult {
        return {
            statusCode: statusCode,
            headers: { ...additionalHeaders, ...RESPONSE_HEADERS },
            body: JSON.stringify({
                statusCode: statusCode,
                message: message,
                payload: responseBody,
            }),
        };
    }

    static handleError(error: Error): APIGatewayProxyResult {
        const code = (error as HttpError).code ?? 500;
        return {
            statusCode: code,
            headers: RESPONSE_HEADERS,
            body: JSON.stringify({
                statusCode: code,
                message: code !== 500 ? error.message : 'Internal server error.',
                error: process.env.STAGE !== 'prod' ? error.stack : error.name,
            }),
        };
    }

    static extractQueryStringParameters(
        event: APIGatewayProxyEvent,
        names: Array<string>,
        strict = true,
    ): Map<string, string> {
        const parameters = new Map<string, string>();

        names.forEach(it => {
            if (event.queryStringParameters === null) {
                if (strict) {
                    throw new BadRequest('no query parameters passed');
                }
            } else {
                if (event.queryStringParameters[it]) {
                    parameters.set(it, event.queryStringParameters[it]);
                } else if (strict) {
                    throw new BadRequest(`parameter ${it} is required`);
                }
            }
        });
        return parameters;
    }

    static bindClient(event: APIGatewayProxyEvent): string {
        if (event.pathParameters === null || event.pathParameters[this.CLIENT] === undefined) {
            throw new BadRequest(`Missing "${this.CLIENT}" from path params.`);
        } else {
            return event.pathParameters[this.CLIENT];
        }
    }

    static bindId(event: APIGatewayProxyEvent): string {
        if (event.pathParameters === null || event.pathParameters[this.ID] === undefined) {
            throw new BadRequest(`Missing "${this.ID}" from path params.`);
        } else {
            return event.pathParameters[this.ID];
        }
    }

    static parse<T extends Record<string, any>>(payload: string, schema: new () => T, strict = true): T {
        const object = JSON.parse(payload);

        const allowed = [this.CLIENT, this.ID];
        const schemaKeys = Object.keys(new schema()).filter(it => !allowed.includes(it));
        const payloadKeys = Object.keys(object).filter(it => !allowed.includes(it));

        const missing = schemaKeys.filter(it => !payloadKeys.includes(it) || object[it] == null);
        const unrecognized = payloadKeys.filter(it => !schemaKeys.includes(it) && object[it] != null);

        if ((!strict || missing.length === 0) && unrecognized.length === 0) {
            return object;
        } else {
            let error = '';
            if (missing.length > 0) error += 'Missing fields: ' + missing.join(', ');
            if (unrecognized.length > 0) error += ' | ' + 'Unrecognized fields: ' + unrecognized.join(', ');
            throw new BadRequest(error);
        }
    }

    static extractJWTFromHeader(headers: { [p: string]: string }): string {
        if (headers['Authorization'] == null || headers['Authorization'] == undefined) {
            throw new Unauthorized("Missing 'Authorization' header.");
        }
        return headers['Authorization'].split(' ')[1];
    }
}
