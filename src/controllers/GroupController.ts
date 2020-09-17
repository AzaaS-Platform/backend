import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { RequestUtils } from './RequestUtils';
import { DatabaseAccessor } from '../database/DatabaseAccessor';
import { GroupService } from '../service/GroupService';
import { BadRequest } from '../error/BadRequest';
import { GroupFactory } from '../model/factory/GroupFactory';
import { GroupDto } from '../model/dto/GroupDto';

export const get: APIGatewayProxyHandler = async (event, _context): Promise<APIGatewayProxyResult> => {
    try {
        const databaseAccessor = new DatabaseAccessor();
        const groupService = new GroupService(databaseAccessor);

        const client = RequestUtils.bindClient(event);
        const id = RequestUtils.bindId(event);

        const group = await groupService.getByKey(client, id);
        return RequestUtils.buildResponse(JSON.stringify(group));
    } catch (e) {
        return RequestUtils.handleError(e);
    }
};

export const getAll: APIGatewayProxyHandler = async (event, _context): Promise<APIGatewayProxyResult> => {
    try {
        const databaseAccessor = new DatabaseAccessor();
        const groupService = new GroupService(databaseAccessor);

        const client = RequestUtils.bindClient(event);

        const groups = await groupService.getAll(client);
        return RequestUtils.buildResponse(JSON.stringify(groups));
    } catch (e) {
        return RequestUtils.handleError(e);
    }
};

export const add: APIGatewayProxyHandler = async (event, _context): Promise<APIGatewayProxyResult> => {
    try {
        const databaseAccessor = new DatabaseAccessor();
        const groupService = new GroupService(databaseAccessor);

        const client = RequestUtils.bindClient(event);
        if (event.body === null) {
            throw new BadRequest('no body passed');
        }

        const item = RequestUtils.parse(event.body, GroupDto);
        const group = GroupFactory.fromDtoNew(client, item);

        await groupService.add(group);
        return RequestUtils.buildResponse('ok');
    } catch (e) {
        return RequestUtils.handleError(e);
    }
};

export const modify: APIGatewayProxyHandler = async (event, _context): Promise<APIGatewayProxyResult> => {
    try {
        const databaseAccessor = new DatabaseAccessor();
        const groupService = new GroupService(databaseAccessor);

        const client = RequestUtils.bindClient(event);
        const id = RequestUtils.bindId(event);
        if (event.body === null) {
            throw new BadRequest('no body passed');
        }

        const item = RequestUtils.parse(event.body, GroupDto);
        const group = GroupFactory.fromDto(client, id, item);

        await groupService.modify(group);
        return RequestUtils.buildResponse('ok');
    } catch (e) {
        return RequestUtils.handleError(e);
    }
};

export const remove: APIGatewayProxyHandler = async (event, _context): Promise<APIGatewayProxyResult> => {
    try {
        const databaseAccessor = new DatabaseAccessor();
        const groupService = new GroupService(databaseAccessor);

        const client = RequestUtils.bindClient(event);
        const id = RequestUtils.bindId(event);

        await groupService.delete(client, id);
        return RequestUtils.buildResponse('ok');
    } catch (e) {
        return RequestUtils.handleError(e);
    }
};

export const test: APIGatewayProxyHandler = async (event, _context): Promise<APIGatewayProxyResult> => {
    try {
        if (event.body === null) {
            throw new BadRequest('no body passed');
        }

        RequestUtils.parse(event.body, GroupDto);

        return RequestUtils.buildResponse('ok');
    } catch (e) {
        return RequestUtils.handleError(e);
    }
};
