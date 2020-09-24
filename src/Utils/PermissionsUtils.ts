import { HttpError } from '../error/HttpError';
import * as jwt from 'jsonwebtoken';
import { JWTPayloadFactory } from '../model/factory/JWTPayloadFactory';
import { UserService } from '../service/UserService';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

export class PermissionsUtils {
    private static INVALID_JSON_WEB_TOKEN = 'Invalid Json Web Token. Authorization not given.';
    private static TOKEN_EXPIRED = 'Expired Json Web Token. Authorization not given.';

    /**
     * Checks for admin permissions and then calls the callback function.
     * @param jwt JWT object
     * @param userService
     * @param callback function to call in case of success.
     */
    public static async requireAdminPermissions<T>(
        jwt: string,
        userService: UserService,
        callback: () => T,
    ): Promise<T> {
        if (!(await this.checkAdminPermissions(jwt, userService))) {
            throw new HttpError(401, 'Unauthorized.');
        }
        return callback();
    }

    /**
     * Unfortunately it's basically just a copy of AuthenticationService.authorize method.
     */
    private static async checkAdminPermissions(token: string, userService: UserService): Promise<boolean> {
        try {
            const payload = JWTPayloadFactory.fromToken(token);
            const user = await userService.getByKey(payload.clt, payload.usr);
            if (user === null) {
                throw new JsonWebTokenError(this.INVALID_JSON_WEB_TOKEN);
            }
            jwt.verify(token, user.passwordHash);
            return user.isAdmin;
        } catch (error) {
            if (error instanceof TokenExpiredError) {
                throw new HttpError(403, this.TOKEN_EXPIRED);
            } else if (error instanceof JsonWebTokenError) {
                throw new HttpError(403, this.INVALID_JSON_WEB_TOKEN);
            }
            throw error;
        }
    }
}
