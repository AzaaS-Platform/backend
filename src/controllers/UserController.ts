import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { DatabaseAccessor } from '../database/DatabaseAccessor';
import { GroupService } from '../service/GroupService';
import { RequestUtils } from '../Utils/RequestUtils';
import { UserService } from '../service/UserService';
import { BadRequest } from '../error/BadRequest';
import { UserDto } from '../model/dto/UserDto';
import { UserFactory } from '../model/factory/UserFactory';
import { PermissionsUtils } from '../Utils/PermissionsUtils';

const NO_CONTENT = 'No content.';
const CREATED = 'Created';

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

                const user = await userService.getByKey(client, id);
                const responseBody = UserFactory.toResponse(user);
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

        return await PermissionsUtils.requireAdminPermissions(
            RequestUtils.extractJWTFromHeader(event.headers),
            userService,
            async () => {
                const client = RequestUtils.bindClient(event);

                const users = await userService.getAll(client);
                const responseBody = users.map(user => UserFactory.toResponse(user));
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

        return await PermissionsUtils.requireAdminPermissions(
            RequestUtils.extractJWTFromHeader(event.headers),
            userService,
            async () => {
                if (event.body === null) {
                    throw new BadRequest('Request body cannot be blank.');
                }
                const client = RequestUtils.bindClient(event);

                const item = RequestUtils.parse(event.body, UserDto);
                const user = UserFactory.fromDtoNew(client, item);
                const addedUser = await userService.add(user);
                const responseBody = UserFactory.toResponse(addedUser);
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

        return await PermissionsUtils.requireAdminPermissions(
            RequestUtils.extractJWTFromHeader(event.headers),
            userService,
            async () => {
                if (event.body === null) {
                    throw new BadRequest('Request body cannot be blank.');
                }
                const client = RequestUtils.bindClient(event);
                const id = RequestUtils.bindId(event);

                const item = RequestUtils.parse(event.body, UserDto);
                const user = UserFactory.fromDto(client, id, item);
                await userService.modify(user);
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

        return await PermissionsUtils.requireAdminPermissions(
            RequestUtils.extractJWTFromHeader(event.headers),
            userService,
            async () => {
                const client = RequestUtils.bindClient(event);
                const id = RequestUtils.bindId(event);

                await userService.delete(client, id);
                return RequestUtils.buildResponse(NO_CONTENT, 204);
            },
        );
    } catch (e) {
        return RequestUtils.handleError(e);
    }
};
