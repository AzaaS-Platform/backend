import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { UserService } from '../service/UserService';
import { DatabaseAccessor } from '../database/DatabaseAccessor';
import { GroupService } from '../service/GroupService';
import { BadRequest } from '../error/BadRequest';
import { RequestUtils } from './RequestUtils';

export const hello: APIGatewayProxyHandler = async (_, _context): Promise<APIGatewayProxyResult> => {
    return RequestUtils.buildResponse('Hello world!');
};

export const bye: APIGatewayProxyHandler = async (_, _context): Promise<APIGatewayProxyResult> => {
    return RequestUtils.buildResponse('Bye!');
};

export const getUser: APIGatewayProxyHandler = async (event, _context): Promise<APIGatewayProxyResult> => {
    try {
        const databaseAccessor = new DatabaseAccessor();
        const groupService = new GroupService(databaseAccessor);
        const userService = new UserService(databaseAccessor, groupService);

        if (event.queryStringParameters != null) {
            const user = await userService.getUserByKey(
                event.queryStringParameters['client'],
                event.queryStringParameters['id'],
            );
            return RequestUtils.buildResponse(JSON.stringify(user));
        } else throw new BadRequest('empty query paremeters');
    } catch (e) {
        return RequestUtils.handleError(e);
    }
};

export const getGroup: APIGatewayProxyHandler = async (event, _context): Promise<APIGatewayProxyResult> => {
    try {
        const databaseAccessor = new DatabaseAccessor();
        const groupService = new GroupService(databaseAccessor);

        if (event.queryStringParameters != null) {
            const group = await groupService.getGroupByKey(
                event.queryStringParameters['client'],
                event.queryStringParameters['id'],
            );
            return RequestUtils.buildResponse(JSON.stringify(group));
        } else throw new BadRequest('empty query paremeters');
    } catch (e) {
        return RequestUtils.handleError(e);
    }
};
