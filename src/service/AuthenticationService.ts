import { UserService } from './UserService';
import * as jwt from 'jsonwebtoken';
import { PasswordUtils } from '../Utils/PasswordUtils';
import { BadRequest } from '../error/BadRequest';
import { JWTPayloadFactory } from '../model/factory/JWTPayloadFactory';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { HttpError } from '../error/HttpError';
import { User } from '../model/User';
import { v4 as UUID } from 'uuid';

export class AuthenticationService {
    private INCORRECT_CREDENTIALS_ERROR = 'Incorrect credentials';
    private INVALID_JSON_WEB_TOKEN = 'Invalid Json Web Token. Authorization not given.';
    private TOKEN_EXPIRED = 'Expired Json Web Token. Authorization not given.';
    private TOKEN_EXPIRATION_TIME = '30m';

    constructor(private userService: UserService) {}

    public async generateTokenForUser(client: string, username: string, password: string): Promise<string> {
        const user = await this.userService.getByUsername(client, username);
        if (user === null || !PasswordUtils.validate(password, user.passwordHash)) {
            throw new BadRequest(this.INCORRECT_CREDENTIALS_ERROR);
        }
        const payload = JWTPayloadFactory.from(client, user.entity);

        return jwt.sign({ payload }, user.JWTSecret as string, { expiresIn: this.TOKEN_EXPIRATION_TIME });
    }

    public async checkPermissionsForUser(token: string, permissionRequired: Array<string>): Promise<boolean> {
        try {
            const user = await this.getUserFromToken(token);
            jwt.verify(token, user.JWTSecret as string);

            //TODO: permissions matcher.
            return permissionRequired.every(permission =>
                user.groupObjects.flatMap(group => group.permissions).includes(permission),
            );
        } catch (error) {
            if (error instanceof TokenExpiredError) {
                throw new HttpError(403, this.TOKEN_EXPIRED);
            } else if (error instanceof JsonWebTokenError) {
                throw new HttpError(403, this.INVALID_JSON_WEB_TOKEN);
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
                throw new HttpError(403, this.TOKEN_EXPIRED);
            } else if (error instanceof JsonWebTokenError) {
                throw new HttpError(403, this.INVALID_JSON_WEB_TOKEN);
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
                throw new HttpError(403, this.TOKEN_EXPIRED);
            } else if (error instanceof JsonWebTokenError) {
                throw new HttpError(403, this.INVALID_JSON_WEB_TOKEN);
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
}
