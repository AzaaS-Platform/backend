import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { DatabaseAccessor } from '../database/DatabaseAccessor';
import { GroupService } from '../service/GroupService';
import { UserService } from '../service/UserService';
import { AuthenticationService } from '../service/AuthenticationService';
import { RequestUtils } from '../utils/RequestUtils';
import { CredentialsRequestDto } from '../model/dto/request/CredentialsRequestDto';
import { BadRequest } from '../error/BadRequest';
import { AuthorizeRequestDto } from '../model/dto/request/AuthorizeRequestDto';
import { Forbidden } from '../error/Forbidden';
import { ClientService } from '../service/ClientService';

const BODY_CANNOT_BE_BLANK_ERROR = 'Request body cannot be blank.';
const MISSING_CREDENTIALS_ERROR = 'Missing credentials.';
const ACCESS_GRANTED_MSG = 'User has access to this resource.';
const FORBIDDEN_MSG = 'User has no sufficient permissions to access this resource.';
const TOKEN_INVALIDATED_MSG = 'Token invalidated.';

/**
 * @httpMethod POST
 * Returns Json Web Token if user credentials are correct. User may use JWT to authorize himself when making future requests.
 */
export const authenticate: APIGatewayProxyHandler = async (event, _context): Promise<APIGatewayProxyResult> => {
    try {
        const databaseAccessor = new DatabaseAccessor();
        const groupService = new GroupService(databaseAccessor);
        const userService = new UserService(databaseAccessor, groupService);
        const clientService = new ClientService(databaseAccessor);
        const authenticationService = new AuthenticationService(userService);

        if (event.body === null) {
            throw new BadRequest(BODY_CANNOT_BE_BLANK_ERROR);
        }

        const clientId = RequestUtils.extractClientFromHeader(event.headers);
        const queryParams = RequestUtils.extractQueryStringParameters(event, ['returnUrl'], false);
        const redirectUrl = queryParams.get('returnUrl');
        const client = await clientService.getByKey(clientId);

        const item = RequestUtils.parse(event.body, CredentialsRequestDto, false);
        if (item.username === null || item.password === null) {
            throw new BadRequest(MISSING_CREDENTIALS_ERROR);
        }

        const jwt = await authenticationService.generateTokenForUser(
            clientId,
            item.username,
            item.password,
            item.token,
        );

        if (!redirectUrl) {
            return RequestUtils.buildResponseWithBody({
                token: jwt,
            });
        } else if (client?.isUrlAllowed(redirectUrl)) {
            return RequestUtils.buildResponseWithBody({
                location: redirectUrl,
                token: jwt,
            });
        }
        throw new BadRequest('Provided return URL is not allowed.');
    } catch (e) {
        return RequestUtils.handleError(e);
    }
};

/**
 * @httpMethod POST
 * @Authorization Required
 * Returns true if user sending a request has permissions for the requested resource, false otherwise.
 */
export const authorize: APIGatewayProxyHandler = async (event, _context): Promise<APIGatewayProxyResult> => {
    try {
        const databaseAccessor = new DatabaseAccessor();
        const groupService = new GroupService(databaseAccessor);
        const userService = new UserService(databaseAccessor, groupService);
        const authenticationService = new AuthenticationService(userService);

        if (event.body === null) {
            throw new BadRequest(BODY_CANNOT_BE_BLANK_ERROR);
        }

        const token = RequestUtils.extractJWTFromHeader(event.headers);
        const client = RequestUtils.extractClientFromHeader(event.headers);

        const authorizeRequest = RequestUtils.parse(event.body, AuthorizeRequestDto);
        const userHasPermissions = await authenticationService.checkPermissionsForUser(
            client,
            token,
            authorizeRequest.requiredPermissions ?? [],
        );

        if (userHasPermissions) {
            return RequestUtils.buildResponse(ACCESS_GRANTED_MSG, 200);
        } else {
            throw new Forbidden(FORBIDDEN_MSG);
        }
    } catch (e) {
        return RequestUtils.handleError(e);
    }
};

/**
 * @httpMethod GET
 * @Authorization Required
 * Invalidates all existing tokens of user making a request.
 */
export const invalidate: APIGatewayProxyHandler = async (event, _context): Promise<APIGatewayProxyResult> => {
    try {
        const databaseAccessor = new DatabaseAccessor();
        const groupService = new GroupService(databaseAccessor);
        const userService = new UserService(databaseAccessor, groupService);
        const authenticationService = new AuthenticationService(userService);

        const token = RequestUtils.extractJWTFromHeader(event.headers);
        await authenticationService.invalidateToken(token);
        return RequestUtils.buildResponse(TOKEN_INVALIDATED_MSG);
    } catch (e) {
        return RequestUtils.handleError(e);
    }
};

/**
 * @httpMethod GET
 * @Authorization Required
 * Returns a new Json Web Token, when currently passed is correct.
 */
export const refresh: APIGatewayProxyHandler = async (event, _context): Promise<APIGatewayProxyResult> => {
    try {
        const databaseAccessor = new DatabaseAccessor();
        const groupService = new GroupService(databaseAccessor);
        const userService = new UserService(databaseAccessor, groupService);
        const authenticationService = new AuthenticationService(userService);

        const token = RequestUtils.extractJWTFromHeader(event.headers);
        const jwt = await authenticationService.refreshToken(token);
        return RequestUtils.buildResponseWithBody({
            token: jwt,
        });
    } catch (e) {
        return RequestUtils.handleError(e);
    }
};
