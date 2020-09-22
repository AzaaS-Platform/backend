import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { DatabaseAccessor } from '../database/DatabaseAccessor';
import { GroupService } from '../service/GroupService';
import { RequestUtils } from './RequestUtils';
import { UserService } from '../service/UserService';
import { BadRequest } from '../error/BadRequest';
import { UserDto } from '../model/dto/UserDto';
import { UserFactory } from '../model/factory/UserFactory';
import { UserResponse } from '../model/response/UserResponse';

export const get: APIGatewayProxyHandler = async (event, _context): Promise<APIGatewayProxyResult> => {
    try {
        const databaseAccessor = new DatabaseAccessor();
        const groupService = new GroupService(databaseAccessor);
        const userService = new UserService(databaseAccessor, groupService);

        const client = RequestUtils.bindClient(event);
        const id = RequestUtils.bindId(event);

        const user = await userService.getByKey(client, id);
        const responseBody =
            user === null ? {} : new UserResponse(user.client, user.entity, user.username, user.groups);
        return RequestUtils.buildResponse(JSON.stringify(responseBody));
    } catch (e) {
        return RequestUtils.handleError(e);
    }
};

export const getAll: APIGatewayProxyHandler = async (event, _context): Promise<APIGatewayProxyResult> => {
    try {
        const databaseAccessor = new DatabaseAccessor();
        const groupService = new GroupService(databaseAccessor);
        const userService = new UserService(databaseAccessor, groupService);

        const client = RequestUtils.bindClient(event);

        const users = await userService.getAll(client);
        const responseBody = users.map(user => new UserResponse(user.client, user.entity, user.username, user.groups));
        return RequestUtils.buildResponse(JSON.stringify(responseBody));
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
        const client = RequestUtils.bindClient(event);

        const item = RequestUtils.parse(event.body, UserDto);
        const user = UserFactory.fromDtoNew(client, item);
        await userService.add(user);
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
        const client = RequestUtils.bindClient(event);
        const id = RequestUtils.bindId(event);

        const item = RequestUtils.parse(event.body, UserDto);
        const user = UserFactory.fromDto(client, id, item);
        await userService.modify(user);
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

        const client = RequestUtils.bindClient(event);
        const id = RequestUtils.bindId(event);

        await userService.delete(client, id);
        return RequestUtils.buildResponse('ok');
    } catch (e) {
        return RequestUtils.handleError(e);
    }
};
