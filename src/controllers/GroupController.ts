import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { RequestUtils } from '../Utils/RequestUtils';
import { DatabaseAccessor } from '../database/DatabaseAccessor';
import { GroupService } from '../service/GroupService';
import { BadRequest } from '../error/BadRequest';
import { GroupFactory } from '../model/factory/GroupFactory';
import { GroupDto } from '../model/dto/GroupDto';
import { GroupResponse } from '../model/response/GroupResponse';
import { UserService } from '../service/UserService';
import { PermissionsUtils } from '../Utils/PermissionsUtils';

export const get: APIGatewayProxyHandler = async (event, _context): Promise<APIGatewayProxyResult> => {
    try {
        const databaseAccessor = new DatabaseAccessor();
        const groupService = new GroupService(databaseAccessor);
        const userService = new UserService(databaseAccessor, groupService);

        return await PermissionsUtils.requireAdminPermissions(
            RequestUtils.extractJWTFromHeader(event.headers),
            userService,
            async () => {
                const client = RequestUtils.bindClient(event);
                const id = RequestUtils.bindId(event);

                const group = await groupService.getByKey(client, id);

                const responseBody =
                    group === null ? {} : new GroupResponse(group?.client, group?.entity, group?.permissions);
                return RequestUtils.buildResponseWithBody(JSON.stringify(responseBody));
            },
        );
    } catch (e) {
        return RequestUtils.handleError(e);
    }
};

export const getAll: APIGatewayProxyHandler = async (event, _context): Promise<APIGatewayProxyResult> => {
    try {
        const databaseAccessor = new DatabaseAccessor();
        const groupService = new GroupService(databaseAccessor);
        const userService = new UserService(databaseAccessor, groupService);

        return await PermissionsUtils.requireAdminPermissions(
            RequestUtils.extractJWTFromHeader(event.headers),
            userService,
            async () => {
                const client = RequestUtils.bindClient(event);

                const groups = await groupService.getAll(client);
                const responseBody = groups.map(
                    group => new GroupResponse(group.client, group.entity, group.permissions),
                );
                return RequestUtils.buildResponseWithBody(JSON.stringify(responseBody));
            },
        );
    } catch (e) {
        return RequestUtils.handleError(e);
    }
};

export const add: APIGatewayProxyHandler = async (event, _context): Promise<APIGatewayProxyResult> => {
    try {
        const databaseAccessor = new DatabaseAccessor();
        const groupService = new GroupService(databaseAccessor);
        const userService = new UserService(databaseAccessor, groupService);

        return await PermissionsUtils.requireAdminPermissions(
            RequestUtils.extractJWTFromHeader(event.headers),
            userService,
            async () => {
                const client = RequestUtils.bindClient(event);
                if (event.body === null) {
                    throw new BadRequest('Request body cannot be blank.');
                }

                const item = RequestUtils.parse(event.body, GroupDto);
                const group = GroupFactory.fromDtoNew(client, item);

                await groupService.add(group);
                return RequestUtils.buildResponse('No content.', 204);
            },
        );
    } catch (e) {
        return RequestUtils.handleError(e);
    }
};

export const modify: APIGatewayProxyHandler = async (event, _context): Promise<APIGatewayProxyResult> => {
    try {
        const databaseAccessor = new DatabaseAccessor();
        const groupService = new GroupService(databaseAccessor);
        const userService = new UserService(databaseAccessor, groupService);

        return await PermissionsUtils.requireAdminPermissions(
            RequestUtils.extractJWTFromHeader(event.headers),
            userService,
            async () => {
                const client = RequestUtils.bindClient(event);
                const id = RequestUtils.bindId(event);
                if (event.body === null) {
                    throw new BadRequest('Request body cannot be blank.');
                }

                const item = RequestUtils.parse(event.body, GroupDto);
                const group = GroupFactory.fromDto(client, id, item);

                await groupService.modify(group);
                return RequestUtils.buildResponse('No content.', 204);
            },
        );
    } catch (e) {
        return RequestUtils.handleError(e);
    }
};

export const remove: APIGatewayProxyHandler = async (event, _context): Promise<APIGatewayProxyResult> => {
    try {
        const databaseAccessor = new DatabaseAccessor();
        const groupService = new GroupService(databaseAccessor);
        const userService = new UserService(databaseAccessor, groupService);

        return await PermissionsUtils.requireAdminPermissions(
            RequestUtils.extractJWTFromHeader(event.headers),
            userService,
            async () => {
                const client = RequestUtils.bindClient(event);
                const id = RequestUtils.bindId(event);

                await groupService.delete(client, id);
                return RequestUtils.buildResponse('No content', 204);
            },
        );
    } catch (e) {
        return RequestUtils.handleError(e);
    }
};

export const test: APIGatewayProxyHandler = async (event, _context): Promise<APIGatewayProxyResult> => {
    try {
        if (event.body === null) {
            throw new BadRequest('Request body cannot be blank.');
        }

        RequestUtils.parse(event.body, GroupDto);

        return RequestUtils.buildResponse("Ok. It's a test endpoint.", 200);
    } catch (e) {
        return RequestUtils.handleError(e);
    }
};
