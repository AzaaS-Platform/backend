import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { RequestUtils } from './RequestUtils';
import { DatabaseAccessor } from '../database/DatabaseAccessor';
import { GroupService } from '../service/GroupService';
import { RequestParameterConstants } from './RequestParameterConstants';
import { BadRequest } from '../error/BadRequest';
import { Group } from '../model/Group';

export const get: APIGatewayProxyHandler = async (event, _context): Promise<APIGatewayProxyResult> => {
    try {
        const databaseAccessor = new DatabaseAccessor();
        const groupService = new GroupService(databaseAccessor);

        const map = RequestUtils.extractQueryStringParameters(event, [
            RequestParameterConstants.CLIENT,
            RequestParameterConstants.ID,
        ]);

        const group = await groupService.getByKey(
            map.get(RequestParameterConstants.CLIENT) as string,
            map.get(RequestParameterConstants.ID) as string,
        );
        return RequestUtils.buildResponse(JSON.stringify(group));
    } catch (e) {
        return RequestUtils.handleError(e);
    }
};

export const getAll: APIGatewayProxyHandler = async (event, _context): Promise<APIGatewayProxyResult> => {
    try {
        const databaseAccessor = new DatabaseAccessor();
        const groupService = new GroupService(databaseAccessor);

        const map = RequestUtils.extractQueryStringParameters(event, [RequestParameterConstants.CLIENT]);

        const groups = await groupService.getAll(map.get(RequestParameterConstants.CLIENT) as string);
        return RequestUtils.buildResponse(JSON.stringify(groups));
    } catch (e) {
        return RequestUtils.handleError(e);
    }
};

export const add: APIGatewayProxyHandler = async (event, _context): Promise<APIGatewayProxyResult> => {
    try {
        const databaseAccessor = new DatabaseAccessor();
        const groupService = new GroupService(databaseAccessor);

        if (event.body === null) {
            throw new BadRequest('no body passed');
        }
        const item = await Group.fromObject(JSON.parse(event.body));
        await groupService.add(item);
        return RequestUtils.buildResponse('ok');
    } catch (e) {
        return RequestUtils.handleError(e);
    }
};

export const modify: APIGatewayProxyHandler = async (event, _context): Promise<APIGatewayProxyResult> => {
    try {
        const databaseAccessor = new DatabaseAccessor();
        const groupService = new GroupService(databaseAccessor);

        if (event.body === null) {
            throw new BadRequest('no body passed');
        }
        const item = await Group.fromObject(JSON.parse(event.body));
        await groupService.modify(item);
        return RequestUtils.buildResponse('ok');
    } catch (e) {
        return RequestUtils.handleError(e);
    }
};

export const remove: APIGatewayProxyHandler = async (event, _context): Promise<APIGatewayProxyResult> => {
    try {
        const databaseAccessor = new DatabaseAccessor();
        const groupService = new GroupService(databaseAccessor);

        if (event.body === null) {
            throw new BadRequest('no body passed');
        }
        const item = await Group.fromObject(JSON.parse(event.body));
        await groupService.delete(item);
        return RequestUtils.buildResponse('ok');
    } catch (e) {
        return RequestUtils.handleError(e);
    }
};
