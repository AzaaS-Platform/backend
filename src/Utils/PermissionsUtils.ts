import { HttpError } from '../error/HttpError';

export class PermissionsUtils {
    /**
     * Checks for admin permissions and then calls the callback function.
     * @param jwt JWT object
     * @param callback function to call in case of success.
     */
    public static requireAdminPermissions<T>(jwt: JWT, callback: () => T): T {
        if (!this.checkAdminPermissions(jwt)) {
            throw new HttpError(401, 'Unauthorized.');
        }
        return callback();
    }

    private static checkAdminPermissions(jwt: JWT): boolean {
        return new Date().getSeconds() % 2 === 0;
    }
}
