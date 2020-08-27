import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { DatabaseAccessor } from '../database/DatabaseAccessor';
import { GroupService } from '../service/GroupService';
import { RequestUtils } from './RequestUtils';
import { RequestParameterConstants } from './RequestParameterConstants';
import { UserService } from '../service/UserService';
import { BadRequest } from '../error/BadRequest';
import { User } from '../model/User';

export const get: APIGatewayProxyHandler = async (event, _context): Promise<APIGatewayProxyResult> => {
    try {
        const databaseAccessor = new DatabaseAccessor();
        const groupService = new GroupService(databaseAccessor);
        const userService = new UserService(databaseAccessor, groupService);

        const map = RequestUtils.extractQueryStringParameters(event, [
            RequestParameterConstants.CLIENT,
            RequestParameterConstants.ID,
        ]);

        const user = await userService.getByKey(
            map.get(RequestParameterConstants.CLIENT) as string,
            map.get(RequestParameterConstants.ID) as string,
        );
        return RequestUtils.buildResponse(JSON.stringify(user));
    } catch (e) {
        return RequestUtils.handleError(e);
    }
};

export const getAll: APIGatewayProxyHandler = async (event, _context): Promise<APIGatewayProxyResult> => {
    try {
        const databaseAccessor = new DatabaseAccessor();
        const groupService = new GroupService(databaseAccessor);
        const userService = new UserService(databaseAccessor, groupService);

        const map = RequestUtils.extractQueryStringParameters(event, [RequestParameterConstants.CLIENT]);

        const users = await userService.getAll(map.get(RequestParameterConstants.CLIENT) as string);
        return RequestUtils.buildResponse(JSON.stringify(users));
    } catch (e) {
        return RequestUtils.handleError(e);
    }
};

export const add: APIGatewayProxyHandler = async (event, _context): Promise<APIGatewayProxyResult> => {
    try {
        const databaseAccessor = new DatabaseAccessor();
        const groupService = new GroupService(databaseAccessor);
        const userService = new UserService(databaseAccessor, groupService);

        if (event.body === null) {
            throw new BadRequest('no body passed');
        }
        const item = await User.fromObject(JSON.parse(event.body));
        await userService.add(item);
        return RequestUtils.buildResponse('ok');
    } catch (e) {
        return RequestUtils.handleError(e);
    }
};

export const modify: APIGatewayProxyHandler = async (event, _context): Promise<APIGatewayProxyResult> => {
    try {
        const databaseAccessor = new DatabaseAccessor();
        const groupService = new GroupService(databaseAccessor);
        const userService = new UserService(databaseAccessor, groupService);

        if (event.body === null) {
            throw new BadRequest('no body passed');
        }
        const item = await User.fromObject(JSON.parse(event.body));
        await userService.modify(item);
        return RequestUtils.buildResponse('ok');
    } catch (e) {
        return RequestUtils.handleError(e);
    }
};

export const remove: APIGatewayProxyHandler = async (event, _context): Promise<APIGatewayProxyResult> => {
    try {
        const databaseAccessor = new DatabaseAccessor();
        const groupService = new GroupService(databaseAccessor);
        const userService = new UserService(databaseAccessor, groupService);

        if (event.body === null) {
            throw new BadRequest('no body passed');
        }
        const item = await User.fromObject(JSON.parse(event.body));
        await userService.delete(item);
        return RequestUtils.buildResponse('ok');
    } catch (e) {
        return RequestUtils.handleError(e);
    }
};
