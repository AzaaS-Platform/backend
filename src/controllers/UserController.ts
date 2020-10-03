import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { DatabaseAccessor } from '../database/DatabaseAccessor';
import { GroupService } from '../service/GroupService';
import { RequestUtils } from '../utils/RequestUtils';
import { UserService } from '../service/UserService';
import { BadRequest } from '../error/BadRequest';
import { UserRequestDto } from '../model/dto/request/UserRequestDto';
import { UserFactory } from '../model/factory/UserFactory';
import { PermissionsUtils } from '../utils/PermissionsUtils';
import { PasswordUtils } from '../utils/PasswordUtils';
import { NotFound } from '../error/NotFound';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { DbMappingConstants } from '../database/DbMappingConstants';

const NO_CONTENT = 'No content.';
const CREATED = 'Created';
const REQUEST_CAN_NOT_BE_BLANK = 'Request body cannot be blank.';
const USER_NOT_FOUND = 'User was not found.';
const USERS_NOT_FOUND = 'Users were not found.';
const GROUP_NOT_FOUND = 'Group was not found.';

const validateGroups = async (
    client: string,
    groups: Array<string> | null,
    groupService: GroupService,
): Promise<boolean> => {
    if (groups == null) {
        return true;
    }
    const existingGroupsIds: Array<string> = (await groupService.getAll(client)).map(group => group.entity);
    return groups.every(group => existingGroupsIds.includes(group));
};

export const get: APIGatewayProxyHandler = async (event, _context): Promise<APIGatewayProxyResult> => {
    try {
        const databaseAccessor = new DatabaseAccessor();
        const groupService = new GroupService(databaseAccessor);
        const userService = new UserService(databaseAccessor, groupService);

        const client = RequestUtils.bindClient(event);
        const id = RequestUtils.bindId(event);

        return await PermissionsUtils.requireAdminPermissionsOrUserHimself(
            client,
            id,
            RequestUtils.extractJWTFromHeader(event.headers),
            userService,
            async () => {
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

        const client = RequestUtils.bindClient(event);

        return await PermissionsUtils.requireAdminPermissions(
            client,
            RequestUtils.extractJWTFromHeader(event.headers),
            userService,
            async () => {
                const users = await userService.getAll(client);
                if (users.length === 0) {
                    throw new NotFound(USERS_NOT_FOUND);
                }
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

        const client = RequestUtils.bindClient(event);

        return await PermissionsUtils.requireAdminPermissions(
            client,
            RequestUtils.extractJWTFromHeader(event.headers),
            userService,
            async () => {
                if (event.body === null) {
                    throw new BadRequest(REQUEST_CAN_NOT_BE_BLANK);
                }
                const item = RequestUtils.parse(event.body, UserRequestDto);
                const user = UserFactory.fromDtoNew(client, item);

                if (!(await validateGroups(client, user.groups, groupService))) {
                    throw new NotFound(GROUP_NOT_FOUND);
                }
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

        const client = RequestUtils.bindClient(event);
        const id = RequestUtils.bindId(event);

        return await PermissionsUtils.requireAdminPermissionsOrUserHimself(
            client,
            RequestUtils.extractJWTFromHeader(event.headers),
            id,
            userService,
            async () => {
                if (event.body === null) {
                    throw new BadRequest(REQUEST_CAN_NOT_BE_BLANK);
                }
                const item: UserRequestDto = RequestUtils.parse(event.body, UserRequestDto, false);
                const user = await userService.getByKey(client, id);
                if (user === null) {
                    throw new NotFound(USER_NOT_FOUND);
                }
                if (!(await validateGroups(client, item.groups, groupService))) {
                    throw new NotFound(GROUP_NOT_FOUND);
                }

                //Modify workaround for now.
                const modifiedUser = Object.assign(user, item, {
                    passwordHash: item.password != null ? PasswordUtils.hash(item.password) : user?.passwordHash,
                });

                await userService.modify(modifiedUser);
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

                await userService.delete(client, id);
                return RequestUtils.buildResponse(NO_CONTENT, 204);
            },
        );
    } catch (e) {
        return RequestUtils.handleError(e);
    }
};

export const add2FA: APIGatewayProxyHandler = async (event, _context): Promise<APIGatewayProxyResult> => {
    try {
        const databaseAccessor = new DatabaseAccessor();
        const groupService = new GroupService(databaseAccessor);
        const userService = new UserService(databaseAccessor, groupService);

        const client = RequestUtils.bindClient(event);
        const id = RequestUtils.bindId(event);

        return await PermissionsUtils.requireAdminPermissionsOrUserHimself(
            client,
            RequestUtils.extractJWTFromHeader(event.headers),
            id,
            userService,
            async () => {
                const user = await userService.getByKey(client, id);
                if (user == null) {
                    throw new NotFound(USER_NOT_FOUND);
                }
                const secret = speakeasy.generateSecret({ name: 'AzaaS Platform' });
                user.MFASecret = secret.ascii;
                await userService.modify(user);

                const qr = await qrcode.toDataURL(secret.otpauth_url as string);
                return RequestUtils.buildResponseWithBody(
                    Object.assign(secret, { qrcode: qr }),
                    'Two-factor authentication added to the account.',
                );
            },
        );
    } catch (e) {
        return RequestUtils.handleError(e);
    }
};

export const check2FA: APIGatewayProxyHandler = async (event, _context): Promise<APIGatewayProxyResult> => {
    try {
        const databaseAccessor = new DatabaseAccessor();
        const groupService = new GroupService(databaseAccessor);
        const userService = new UserService(databaseAccessor, groupService);

        const client = RequestUtils.bindClient(event);
        const id = RequestUtils.bindId(event);

        return await PermissionsUtils.requireAdminPermissionsOrUserHimself(
            client,
            RequestUtils.extractJWTFromHeader(event.headers),
            id,
            userService,
            async () => {
                const user = await userService.getByKey(client, id);
                if (user == null) {
                    throw new NotFound(USER_NOT_FOUND);
                }
                return RequestUtils.buildResponseWithBody({
                    has2FAEnabled: user.MFASecret != DbMappingConstants.MFA_NOT_ENABLED_MAGIC_VALUE,
                });
            },
        );
    } catch (e) {
        return RequestUtils.handleError(e);
    }
};

export const remove2FA: APIGatewayProxyHandler = async (event, _context): Promise<APIGatewayProxyResult> => {
    try {
        const databaseAccessor = new DatabaseAccessor();
        const groupService = new GroupService(databaseAccessor);
        const userService = new UserService(databaseAccessor, groupService);

        const client = RequestUtils.bindClient(event);
        const id = RequestUtils.bindId(event);

        return await PermissionsUtils.requireAdminPermissionsOrUserHimself(
            client,
            RequestUtils.extractJWTFromHeader(event.headers),
            id,
            userService,
            async () => {
                const user = await userService.getByKey(client, id);
                if (user == null) {
                    throw new NotFound(USER_NOT_FOUND);
                }
                user.MFASecret = DbMappingConstants.MFA_NOT_ENABLED_MAGIC_VALUE;
                await userService.modify(user);
                return RequestUtils.buildResponse('Two-factor authentication removed from the account.');
            },
        );
    } catch (e) {
        return RequestUtils.handleError(e);
    }
};
