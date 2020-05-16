import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { HttpError } from '../error/HttpError';
import { BadRequest } from '../error/BadRequest';

export class RequestUtils {
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
}
