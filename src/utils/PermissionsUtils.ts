import { HttpError } from '../error/HttpError';
import * as jwt from 'jsonwebtoken';
import { JWTPayloadFactory } from '../model/factory/JWTPayloadFactory';
import { UserService } from '../service/UserService';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { User } from '../model/User';

export class PermissionsUtils {
    private static INVALID_JSON_WEB_TOKEN = 'Invalid Json Web Token. Authorization not given.';
    private static TOKEN_EXPIRED = 'Expired Json Web Token. Authorization not given.';
    private static FORBIDDEN_ADMIN = 'Forbidden. Only administrators are allowed to access the configuration.';
    private static FORBIDDEN_ADMIN_OR_USER_HIMSELF =
        'Forbidden. Only administrators or users themselves are allowed to access this configuration.';

    /**
     * Checks for admin permissions and then calls the callback function.
     * @param jwt JWT object
     * @param client clientId
     * @param userService
     * @param callback function to call in case of success.
     */
    public static async requireAdminPermissions<T>(
        client: string,
        jwt: string,
        userService: UserService,
        callback: () => T,
    ): Promise<T> {
        if (!(await this.checkAdminPermissions(client, jwt, userService))) {
            throw new HttpError(403, this.FORBIDDEN_ADMIN);
        }
        return callback();
    }

    public static async requireAdminPermissionsOrUserHimself<T>(
        client: string,
        jwt: string,
        userId: string,
        userService: UserService,
        callback: () => T,
    ): Promise<T> {
        if (
            !(await this.checkAdminPermissions(client, jwt, userService)) &&
            !(await this.checkIfUserMakingRequestHimself(client, jwt, userId, userService))
        ) {
            throw new HttpError(403, this.FORBIDDEN_ADMIN_OR_USER_HIMSELF);
        }
        return callback();
    }

    /**
     * Unfortunately it's basically just a copy of AuthenticationService.authorize method.
     */
    private static async checkAdminPermissions(
        client: string,
        token: string,
        userService: UserService,
    ): Promise<boolean> {
        try {
            const user = await this.getUserFromPayload(token, userService);
            jwt.verify(token, user.JWTSecret as string);
            return user.isAdmin && user.client == client;
        } catch (error) {
            this.handlePermissionsError(error);
        }
    }

    private static async checkIfUserMakingRequestHimself(
        client: string,
        token: string,
        userId: string,
        userService: UserService,
    ): Promise<boolean> {
        try {
            const user = await this.getUserFromPayload(token, userService);
            jwt.verify(token, user.JWTSecret as string);
            return user.entity == userId && user.client == client;
        } catch (error) {
            this.handlePermissionsError(error);
        }
    }

    private static handlePermissionsError(error: Error): never {
        if (error instanceof TokenExpiredError) {
            throw new HttpError(401, this.TOKEN_EXPIRED);
        } else if (error instanceof JsonWebTokenError) {
            throw new HttpError(401, this.INVALID_JSON_WEB_TOKEN);
        }
        throw error;
    }

    private static async getUserFromPayload(token: string, userService: UserService): Promise<User> {
        const payload = JWTPayloadFactory.fromToken(token);
        const user = await userService.getByKey(payload.clt, payload.usr);
        if (user === null) {
            throw new JsonWebTokenError(this.INVALID_JSON_WEB_TOKEN);
        }
        return user;
    }
}
