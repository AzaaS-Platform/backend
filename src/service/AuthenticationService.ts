import { UserService } from './UserService';
import * as jwt from 'jsonwebtoken';
import { PasswordUtils } from '../utils/PasswordUtils';
import { JWTPayloadFactory } from '../model/factory/JWTPayloadFactory';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { User } from '../model/User';
import { v4 as UUID } from 'uuid';
import { Unauthorized } from '../error/Unauthorized';
import { Forbidden } from '../error/Forbidden';
import { PermissionsMatcher } from '../utils/PermissionsMatcher';
import { DbMappingConstants } from '../database/DbMappingConstants';
import * as speakeasy from 'speakeasy';

export class AuthenticationService {
    private readonly INCORRECT_CREDENTIALS_ERROR = 'Incorrect credentials';
    private readonly INVALID_JSON_WEB_TOKEN = 'Invalid Json Web Token. Authorization not given.';
    private readonly TOKEN_EXPIRED = 'Expired Json Web Token. Authorization not given.';
    private readonly TOKEN_EXPIRATION_TIME = '30m';
    private readonly TWO_FACTOR_AUTH_WINDOW = 1;

    constructor(private userService: UserService) {}

    public async generateTokenForUser(
        client: string,
        username: string,
        password: string,
        MFAToken?: string | null,
    ): Promise<string> {
        const user = await this.userService.getByUsername(client, username);
        if (
            user === null ||
            !PasswordUtils.validate(password, user.passwordHash) ||
            !this.checkTwoFactorAuthentication(user, MFAToken)
        ) {
            throw new Unauthorized(this.INCORRECT_CREDENTIALS_ERROR);
        }
        const payload = JWTPayloadFactory.from(client, user.entity);

        return jwt.sign({ payload }, user.JWTSecret as string, { expiresIn: this.TOKEN_EXPIRATION_TIME });
    }

    public async checkPermissionsForUser(token: string, permissionsRequired: Array<string>): Promise<boolean> {
        try {
            const user = await this.getUserFromToken(token);
            jwt.verify(token, user.JWTSecret as string);

            return PermissionsMatcher.match(
                permissionsRequired,
                user.groupObjects.flatMap(group => group.permissions),
            );
        } catch (error) {
            if (error instanceof TokenExpiredError) {
                throw new Forbidden(this.TOKEN_EXPIRED);
            } else if (error instanceof JsonWebTokenError) {
                throw new Forbidden(this.INVALID_JSON_WEB_TOKEN);
            }
            throw error;
        }
    }

    public async invalidateToken(token: string): Promise<void> {
        try {
            const user = await this.getUserFromToken(token);
            jwt.verify(token, user.JWTSecret as string);
            user.JWTSecret = UUID(); // create a new secret, invalidates all existing tokens.
            await this.userService.modify(user);
        } catch (error) {
            if (error instanceof TokenExpiredError) {
                throw new Unauthorized(this.TOKEN_EXPIRED);
            } else if (error instanceof JsonWebTokenError) {
                throw new Unauthorized(this.INVALID_JSON_WEB_TOKEN);
            }
            throw error;
        }
    }

    public async refreshToken(token: string): Promise<string> {
        try {
            const user = await this.getUserFromToken(token);
            jwt.verify(token, user.JWTSecret as string);

            const payload = JWTPayloadFactory.from(user.client, user.entity);
            return jwt.sign({ payload }, user.JWTSecret as string, { expiresIn: this.TOKEN_EXPIRATION_TIME });
        } catch (error) {
            if (error instanceof TokenExpiredError) {
                throw new Unauthorized(this.TOKEN_EXPIRED);
            } else if (error instanceof JsonWebTokenError) {
                throw new Unauthorized(this.INVALID_JSON_WEB_TOKEN);
            }
            throw error;
        }
    }

    private async getUserFromToken(token: string): Promise<User> {
        const payload = JWTPayloadFactory.fromToken(token);
        const user = await this.userService.getByKey(payload.clt, payload.usr);
        if (user === null) {
            throw new JsonWebTokenError(this.INVALID_JSON_WEB_TOKEN);
        }
        return user;
    }

    private checkTwoFactorAuthentication(user: User, MFAtoken: string | undefined | null): boolean {
        if (user.MFASecret && user.MFASecret !== DbMappingConstants.MFA_NOT_ENABLED_MAGIC_VALUE) {
            //checks
            if (
                !MFAtoken ||
                !speakeasy.totp.verify({
                    secret: user.MFASecret as string,
                    encoding: 'ascii',
                    token: MFAtoken,
                    window: this.TWO_FACTOR_AUTH_WINDOW,
                })
            ) {
                return false;
            }
        }
        return true;
    }
}
