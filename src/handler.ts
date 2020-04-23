import {APIGatewayProxyHandler, APIGatewayProxyResult} from 'aws-lambda';
import {UserService} from "./service/UserService";
import {DatabaseAccessor} from "./DatabaseAccessor";
import {GroupService} from "./service/GroupService";
import {HttpError} from "./error/HttpError";
import {BadRequest} from "./error/BadRequest";

function buildResponse(message: string): APIGatewayProxyResult {
    return {
        statusCode: 200,
        body: message
    };
}

function handleError(error: Error): APIGatewayProxyResult {
    const code = (error as HttpError).code ?? 500;
    return {
        statusCode: code,
        body: `${error.stack}`
    }
}

export const hello: APIGatewayProxyHandler = async (_, _context): Promise<APIGatewayProxyResult> => {
    return buildResponse('Hello world!')
};

export const bye: APIGatewayProxyHandler = async (_, _context): Promise<APIGatewayProxyResult> => {
    return buildResponse('Bye!')
};

export const getUser: APIGatewayProxyHandler = async (event, _context): Promise<APIGatewayProxyResult> => {
    try {
        const databaseAccessor = new DatabaseAccessor();
        const groupService = new GroupService(databaseAccessor);
        const userService = new UserService(databaseAccessor, groupService);

        if (event.queryStringParameters != null) {
            const user = await userService.getUserByKey(event.queryStringParameters['client'], event.queryStringParameters['id']);
            return buildResponse(JSON.stringify(user));
        } else throw new BadRequest("empty query paremeters");
    } catch (e) {
        return handleError(e);
    }
};

export const getGroup: APIGatewayProxyHandler = async (event, _context): Promise<APIGatewayProxyResult> => {
    try {
        const databaseAccessor = new DatabaseAccessor();
        const groupService = new GroupService(databaseAccessor);

        if (event.queryStringParameters != null) {
            const group = await groupService.getGroupByKey(event.queryStringParameters['client'], event.queryStringParameters['id']);
            return buildResponse(JSON.stringify(group));
        } else throw new BadRequest("empty query paremeters");
    } catch (e) {
        return handleError(e);
    }
};