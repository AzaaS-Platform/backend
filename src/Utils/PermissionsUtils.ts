import { HttpError } from '../error/HttpError';
import * as jwt from 'jsonwebtoken';
import { JWTPayloadFactory } from '../model/factory/JWTPayloadFactory';
import { BadRequest } from '../error/BadRequest';
import { UserService } from '../service/UserService';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

export class PermissionsUtils {
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

    private static async checkAdminPermissions(token: string, userService: UserService): Promise<boolean> {
        try {
            const payload = JWTPayloadFactory.fromToken(token);
            const user = await userService.getByKey(payload.clt, payload.usr);
            if (user === null) {
                throw new BadRequest('User not found.');
            }
            jwt.verify(token, user.passwordHash);
            return user.isAdmin;
        } catch (error) {
            if (error instanceof JsonWebTokenError || error instanceof TokenExpiredError) {
                throw new HttpError(403, 'Invalid Json Web Token. Authorization not given.');
            }
            throw error;
        }
    }
}
