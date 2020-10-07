import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { RequestUtils } from '../utils/RequestUtils';
import { DatabaseAccessor } from '../database/DatabaseAccessor';
import { GroupService } from '../service/GroupService';
import { BadRequest } from '../error/BadRequest';
import { GroupFactory } from '../model/factory/GroupFactory';
import { GroupRequestDto } from '../model/dto/request/GroupRequestDto';
import { GroupResponseDto } from '../model/dto/response/GroupResponseDto';
import { UserService } from '../service/UserService';
import { PermissionsUtils } from '../utils/PermissionsUtils';
import { NotFound } from '../error/NotFound';

const NO_CONTENT = 'No content.';
const CREATED = 'Created';
const BODY_CAN_NOT_BE_BLANK = 'Request body cannot be blank';
const GROUPS_NOT_FOUND = 'Groups were not found.';
const GROUP_NOT_FOUND = 'Group was not found.';

export const get: APIGatewayProxyHandler = async (event, _context): Promise<APIGatewayProxyResult> => {
    try {
        const databaseAccessor = new DatabaseAccessor();
        const groupService = new GroupService(databaseAccessor);
        const userService = new UserService(databaseAccessor, groupService);

        const client = RequestUtils.bindClient(event);

        return await PermissionsUtils.requireAdminPermissions(
            client,
            RequestUtils.extractJWTFromHeader(event.headers),
            userService,
            async () => {
                const id = RequestUtils.bindId(event);

                const group = await groupService.getByKey(client, id);
                if (group === null) {
                    throw new NotFound(GROUP_NOT_FOUND);
                }

                const responseBody = new GroupResponseDto(group?.client, group?.entity, group?.permissions);
                return RequestUtils.buildResponseWithBody(responseBody);
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

        const client = RequestUtils.bindClient(event);

        return await PermissionsUtils.requireAdminPermissions(
            client,
            RequestUtils.extractJWTFromHeader(event.headers),
            userService,
            async () => {
                const groups = await groupService.getAll(client);
                if (groups.length === 0) {
                    throw new NotFound(GROUPS_NOT_FOUND);
                }
                const responseBody = groups.map(group => GroupFactory.toResponse(group));
                return RequestUtils.buildResponseWithBody(responseBody);
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

        const client = RequestUtils.bindClient(event);

        return await PermissionsUtils.requireAdminPermissions(
            client,
            RequestUtils.extractJWTFromHeader(event.headers),
            userService,
            async () => {
                if (event.body === null) {
                    throw new BadRequest(BODY_CAN_NOT_BE_BLANK);
                }

                const item = RequestUtils.parse(event.body, GroupRequestDto);
                const group = GroupFactory.fromDtoNew(client, item);

                const addedGroup = await groupService.add(group);
                const responseBody = GroupFactory.toResponse(addedGroup);
                return RequestUtils.buildResponseWithBody(responseBody, CREATED, 201);
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

        const client = RequestUtils.bindClient(event);

        return await PermissionsUtils.requireAdminPermissions(
            client,
            RequestUtils.extractJWTFromHeader(event.headers),
            userService,
            async () => {
                const id = RequestUtils.bindId(event);
                if (event.body === null) {
                    throw new BadRequest(BODY_CAN_NOT_BE_BLANK);
                }

                const group = groupService.getByKey(client, id);
                if (group === null) {
                    throw new NotFound(GROUP_NOT_FOUND);
                }

                const item = RequestUtils.parse(event.body, GroupRequestDto);
                const modifiedGroup = GroupFactory.fromDto(client, id, item);

                await groupService.modify(modifiedGroup);
                return RequestUtils.buildResponse(NO_CONTENT, 204);
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

        const client = RequestUtils.bindClient(event);

        return await PermissionsUtils.requireAdminPermissions(
            client,
            RequestUtils.extractJWTFromHeader(event.headers),
            userService,
            async () => {
                const id = RequestUtils.bindId(event);
                const users = await userService.getAll(client);
                await users
                    .filter(user => user.groups.includes(id))
                    .forEach(async user => {
                        user.groups = user.groups.filter(group => group != id);
                        await userService.modify(user);
                    });
                await groupService.delete(client, id);
                return RequestUtils.buildResponse(NO_CONTENT, 204);
            },
        );
    } catch (e) {
        return RequestUtils.handleError(e);
    }
};
