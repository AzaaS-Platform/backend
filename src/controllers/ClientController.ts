import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { DatabaseAccessor } from '../database/DatabaseAccessor';
import { GroupService } from '../service/GroupService';
import { UserService } from '../service/UserService';
import { ClientService } from '../service/ClientService';
import { RequestUtils } from '../utils/RequestUtils';
import { BadRequest } from '../error/BadRequest';
import { ClientRequestDto } from '../model/dto/request/ClientRequestDto';
import { ClientFactory } from '../model/factory/ClientFactory';
import { UserFactory } from '../model/factory/UserFactory';
import { ClientResponseDto } from '../model/dto/response/ClientResponseDto';
import { Client } from '../model/Client';
import { PermissionsUtils } from '../utils/PermissionsUtils';

const NAME_LENGTH_LIMIT = 64;
const REQUEST_CAN_NOT_BE_BLANK = 'Request body cannot be blank.';
const CLIENT_ALREADY_EXIST = 'Client with this name already exists. Please choose other name.';
const CLIENT_DOES_NOT_EXIST = 'Client does not exist.';
const BAD_LENGTH_CLIENT_NAME = 'Incorrect length of Client name. Max length is ' + NAME_LENGTH_LIMIT;
const BAD_CHARACTER_CLIENT_NAME = 'Incorrect Client name. The name can only contain lowercase letters.';
const NO_HTTP = 'All allowed origins must be https';
const NO_CONTENT = 'No content.';

export const register: APIGatewayProxyHandler = async (event, _context): Promise<APIGatewayProxyResult> => {
    try {
        const databaseAccessor = new DatabaseAccessor();
        const groupService = new GroupService(databaseAccessor);
        const userService = new UserService(databaseAccessor, groupService);
        const clientService = new ClientService(databaseAccessor);

        if (event.body === null) {
            throw new BadRequest(REQUEST_CAN_NOT_BE_BLANK);
        }

        const item = RequestUtils.parse(event.body, ClientRequestDto);
        const clientEntity = ClientFactory.fromDtoNew(item);
        const existingClientEntity = await clientService.getByKey(clientEntity.client);

        // validate client name
        if (existingClientEntity !== null) {
            throw new BadRequest(CLIENT_ALREADY_EXIST);
        }
        if (clientEntity.client.length > NAME_LENGTH_LIMIT) {
            throw new BadRequest(BAD_LENGTH_CLIENT_NAME);
        }
        if (!/^[a-z]+$/.test(clientEntity.client)) {
            throw new BadRequest(BAD_CHARACTER_CLIENT_NAME);
        }

        const adminUser = UserFactory.fromDtoNew(clientEntity.client, {
            username: item.adminUsername,
            password: item.adminPassword,
            groups: [],
        });
        adminUser.isAdmin = true;
        const adminUserCreated = await userService.add(adminUser);
        clientEntity.adminUsers.push(adminUserCreated.entity);

        const clientCreated = (await clientService.add(clientEntity)) as Client;

        const responseBody = new ClientResponseDto(clientCreated.client, clientCreated.adminUsers);
        return RequestUtils.buildResponseWithBody(responseBody);
    } catch (e) {
        return RequestUtils.handleError(e);
    }
};

export const putAllowedUrls: APIGatewayProxyHandler = async (event, _context): Promise<APIGatewayProxyResult> => {
    try {
        const databaseAccessor = new DatabaseAccessor();
        const groupService = new GroupService(databaseAccessor);
        const userService = new UserService(databaseAccessor, groupService);
        const clientService = new ClientService(databaseAccessor);

        const clientId = RequestUtils.extractClientFromHeader(event.headers);
        const client = await clientService.getByKey(clientId);
        const jwt = RequestUtils.extractJWTFromHeader(event.headers);

        if (client === null) throw new BadRequest(CLIENT_DOES_NOT_EXIST);

        return await PermissionsUtils.requireAdminPermissions(clientId, jwt, userService, async () => {
            if (event.body === null) {
                throw new BadRequest(REQUEST_CAN_NOT_BE_BLANK);
            }
            const item = JSON.parse(event.body);
            const allowedUrls = item['allowedUrls'] as Array<string>;

            if (allowedUrls) {
                if (allowedUrls.some(it => it.indexOf('https://') !== 0)) throw new BadRequest(NO_HTTP);

                if (allowedUrls) client.allowedUrls = allowedUrls;
                await clientService.modify(client);
            }

            return RequestUtils.buildResponse(NO_CONTENT, 204);
        });
    } catch (e) {
        return RequestUtils.handleError(e);
    }
};

export const getAllowedUrls: APIGatewayProxyHandler = async (event, _context): Promise<APIGatewayProxyResult> => {
    try {
        const databaseAccessor = new DatabaseAccessor();
        const groupService = new GroupService(databaseAccessor);
        const userService = new UserService(databaseAccessor, groupService);
        const clientService = new ClientService(databaseAccessor);

        const clientId = RequestUtils.extractClientFromHeader(event.headers);
        const client = await clientService.getByKey(clientId);
        const jwt = RequestUtils.extractJWTFromHeader(event.headers);

        if (client === null) throw new BadRequest(CLIENT_DOES_NOT_EXIST);

        return await PermissionsUtils.requireAdminPermissions(clientId, jwt, userService, async () => {
            return RequestUtils.buildResponseWithBody(client.allowedUrls);
        });
    } catch (e) {
        return RequestUtils.handleError(e);
    }
};
