import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { DatabaseAccessor } from '../database/DatabaseAccessor';
import { GroupService } from '../service/GroupService';
import { UserService } from '../service/UserService';
import { AuthenticationService } from '../service/AuthenticationService';
import { RequestUtils } from '../Utils/RequestUtils';
import { CredentialsDto } from '../model/dto/CredentialsDto';
import { BadRequest } from '../error/BadRequest';
import { AuthorizeRequest } from '../model/dto/AuthorizeRequest';

const BODY_CANNOT_BE_BLANK_ERROR = 'Request body cannot be blank.';
const MISSING_CREDENTIALS_ERROR = 'Missing credentials.';
const AUTHORIZED_MSG = 'Authorized.';
const UNAUTHORIZED_MSG = 'Unauthorized.';
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
        const authenticationService = new AuthenticationService(userService);

        if (event.body === null) {
            throw new BadRequest(BODY_CANNOT_BE_BLANK_ERROR);
        }

        const client = RequestUtils.bindClient(event);

        const item = RequestUtils.parse(event.body, CredentialsDto);
        if (item.username === null || item.password === null) {
            throw new BadRequest(MISSING_CREDENTIALS_ERROR);
        }

        const jwt = await authenticationService.generateTokenForUser(client, item.username, item.password);
        return RequestUtils.buildResponseWithBody({
            token: jwt,
        });
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

        const authorizeRequest = RequestUtils.parse(event.body, AuthorizeRequest);
        const isAuthorized = await authenticationService.checkPermissionsForUser(
            token,
            authorizeRequest.requiredPermissions ?? [],
        );

        if (isAuthorized) {
            return RequestUtils.buildResponse(AUTHORIZED_MSG, 200);
        } else {
            return RequestUtils.buildResponse(UNAUTHORIZED_MSG, 401);
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
