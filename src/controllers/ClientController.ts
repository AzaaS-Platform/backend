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

const NAME_LENGTH_LIMIT = 64;
const REQUEST_CAN_NOT_BE_BLANK = 'Request body cannot be blank.';
const CLIENT_ALREADY_EXIST = 'Client with this name already exists. Please choose other name.';
const BAD_LENGTH_CLIENT_NAME = 'Incorrect length of Client name. Max length is ' + NAME_LENGTH_LIMIT;
const BAD_CHARACTER_CLIENT_NAME = 'Incorrect Client name. The name can only contain lowercase letters.';

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
