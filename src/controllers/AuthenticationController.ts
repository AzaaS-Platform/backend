import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { DatabaseAccessor } from '../database/DatabaseAccessor';
import { GroupService } from '../service/GroupService';
import { UserService } from '../service/UserService';
import { AuthenticationService } from '../service/AuthenticationService';
import { RequestUtils } from '../Utils/RequestUtils';
import { CredentialsDto } from '../model/dto/CredentialsDto';
import { BadRequest } from '../error/BadRequest';

export const getToken: APIGatewayProxyHandler = async (event, _context): Promise<APIGatewayProxyResult> => {
    try {
        const databaseAccessor = new DatabaseAccessor();
        const groupService = new GroupService(databaseAccessor);
        const userService = new UserService(databaseAccessor, groupService);
        const authenticationService = new AuthenticationService(userService);

        if (event.body === null) {
            throw new BadRequest('Request body cannot be blank.');
        }

        const client = RequestUtils.bindClient(event);

        const item = RequestUtils.parse(event.body, CredentialsDto);
        if (item.username === null || item.password === null) {
            throw new BadRequest('Missing credentials.');
        }

        const jwt = await authenticationService.generateTokenForUser(client, item.username, item.password);
        console.log(jwt);
        return RequestUtils.buildResponseWithBody(
            JSON.stringify({
                token: jwt,
            }),
        );
    } catch (e) {
        return RequestUtils.handleError(e);
    }
};