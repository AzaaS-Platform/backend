import { UserService } from './UserService';
import * as jwt from 'jsonwebtoken';
import { PasswordUtils } from '../utils/PasswordUtils';
import { JWTPayloadFactory } from '../model/factory/JWTPayloadFactory';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { User } from '../model/User';
import { v4 as UUID } from 'uuid';
import { Unauthorized } from '../error/Unauthorized';
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

    /**
     * Generates a new Json Web Token for a given user based on credentials.
     * Token is generated only when all of the credentials are correct.
     * In case when user has Two-Factor Authentication enabled,
     * the MFAToken is required to proceed with token generation.
     * @param client    The ID of the client for which user belongs
     * @param username  The username of the user for which JWT should be generated
     * @param password  The password of the user for which JWT should be generated
     * @param MFAToken  The two-factor authentication token of the user for which JWT should be generated;
     * required only if user has two-factor authentication enabled.
     * @return generated Json Web Token containing userId, clientId and expiration date.
     */
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

    /**
     * Checks permissions for a user based on Json Web Token.
     * @param token Json Web Token
     * @param permissionsRequired permissions to be queried against
     * @return true if user has all required permissions, false otherwise
     */
    public async checkPermissionsForUser(token: string, permissionsRequired: Array<string>): Promise<boolean> {
        try {
            const user = await this.getUserFromToken(token);
            jwt.verify(token, user.JWTSecret as string);

            return PermissionsMatcher.forUser(user).match(permissionsRequired);
        } catch (error) {
            this.handleAuthorizationError(error);
        }
    }

    /**
     * Invalidates all user Json Web Tokens based on single correctly verified token.
     * @param token Json Web Token
     */
    public async invalidateToken(token: string): Promise<void> {
        try {
            const user = await this.getUserFromToken(token);
            jwt.verify(token, user.JWTSecret as string);
            user.JWTSecret = UUID(); // create a new secret, invalidates all existing tokens.
            await this.userService.modify(user);
        } catch (error) {
            this.handleAuthorizationError(error);
        }
    }

    /**
     * Refreshes a token if it's correctly verified. The `exp` field is reset.
     * @param token Json Web Token to be refreshed.
     * @return refreshed Json Web Token
     */
    public async refreshToken(token: string): Promise<string> {
        try {
            const user = await this.getUserFromToken(token);
            jwt.verify(token, user.JWTSecret as string);

            const payload = JWTPayloadFactory.from(user.client, user.entity);
            return jwt.sign({ payload }, user.JWTSecret as string, { expiresIn: this.TOKEN_EXPIRATION_TIME });
        } catch (error) {
            this.handleAuthorizationError(error);
        }
    }

    /**
     * Generates a new two-factor authentication secret for the user and optionally invalidates all existing JWT tokens.
     * @param user          user for which token should be generated
     * @param jwt           Json Web Token
     * @param tokenLabel    label of the token that will be visible in 2FA app.
     * @return generated secret in the {@link GeneratedSecret} format.
     */
    public async generateMFASecretForUser(user: User, tokenLabel: string): Promise<speakeasy.GeneratedSecret> {
        const secret = speakeasy.generateSecret({ name: tokenLabel });
        user.MFASecret = secret.ascii;

        await this.userService.modify(user);
        return secret;
    }

    /**
     * Checks if user has Two-Factor Authentication enabled.
     * @param user  user for which Two-Factor Authentication should be checked.
     * @return true if user has Two-Factor Authentication enabled, false otherwise.
     */
    public checkMFAEnabledForUser(user: User): boolean {
        return user.MFASecret !== DbMappingConstants.MFA_NOT_ENABLED_MAGIC_VALUE;
    }

    /**
     * Removes the Two-Factor Authentication from user account.
     * @param user  user from which Two-Factor Authentication should be removed.
     */
    public async removeMFAFromUser(user: User): Promise<void> {
        user.MFASecret = DbMappingConstants.MFA_NOT_ENABLED_MAGIC_VALUE;
        await this.userService.modify(user);
    }

    private async getUserFromToken(token: string): Promise<User> {
        const payload = JWTPayloadFactory.fromToken(token);
        const user = await this.userService.getByKey(payload.clt, payload.usr);
        if (user === null) {
            throw new JsonWebTokenError(this.INVALID_JSON_WEB_TOKEN);
        }
        return user;
    }

    private handleAuthorizationError(error: Error): never {
        if (error instanceof TokenExpiredError) {
            throw new Unauthorized(this.TOKEN_EXPIRED);
        } else if (error instanceof JsonWebTokenError) {
            throw new Unauthorized(this.INVALID_JSON_WEB_TOKEN);
        }
        throw error;
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
