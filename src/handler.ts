import {APIGatewayProxyHandler, APIGatewayProxyResult} from 'aws-lambda';
import 'source-map-support/register';
import {UserService} from "./service/UserService";
import DatabaseAccessor from "./DatabaseAccessor";
import {GroupService} from "./service/GroupService";

function buildResponse(code: number, message: string): APIGatewayProxyResult {
    return {
        statusCode: code,
        body: message
    };
}

export const hello: APIGatewayProxyHandler = async (_, _context): Promise<APIGatewayProxyResult> => {
    return buildResponse(200, 'Hello world!')
};

export const bye: APIGatewayProxyHandler = async (_, _context): Promise<APIGatewayProxyResult> => {
    return buildResponse(200, 'Bye!')
};

export const getUser: APIGatewayProxyHandler = async (event, _context): Promise<APIGatewayProxyResult> => {
    const databaseAccessor = new DatabaseAccessor();
    const groupService = new GroupService(databaseAccessor);
    const userService = new UserService(databaseAccessor, groupService);

    if (event.queryStringParameters != null) {
        const user = await userService.getUserByKey(event.queryStringParameters['client'], event.queryStringParameters['id']);
        console.log(user);
        return buildResponse(200, JSON.stringify(user));
    } else return buildResponse(400, JSON.stringify(event));
};

export const getGroup: APIGatewayProxyHandler = async (event, _context): Promise<APIGatewayProxyResult> => {
    const databaseAccessor = new DatabaseAccessor();
    const groupService = new GroupService(databaseAccessor);

    if (event.queryStringParameters != null) {
        const group = await groupService.getGroupByKey(event.queryStringParameters['client'], event.queryStringParameters['id']);
        console.log(group);
        return buildResponse(200, JSON.stringify(group));
    } else return buildResponse(400, JSON.stringify(event));
};