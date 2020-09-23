import { UserService } from './UserService';
import * as jwt from 'jsonwebtoken';
import { PasswordUtils } from '../Utils/PasswordUtils';
import { BadRequest } from '../error/BadRequest';
import { JWTPayloadFactory } from '../model/factory/JWTPayloadFactory';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { HttpError } from '../error/HttpError';

export class AuthenticationService {
    private USER_NOT_FOUND_ERROR = 'User not found.';
    private INCORRECT_CREDENTIALS_ERROR = 'Incorrect credentials';
    private INVALID_JSON_WEB_TOKEN = 'Invalid Json Web Token. Authorization not given.';
    private TOKEN_EXPIRATION_TIME = '30m';

    constructor(private userService: UserService) {}

    public async generateTokenForUser(client: string, username: string, password: string): Promise<string> {
        const user = await this.userService.getByUsername(client, username);
        if (user === null) {
            throw new BadRequest(this.USER_NOT_FOUND_ERROR);
        }
        if (!PasswordUtils.validate(password, user.passwordHash)) {
            throw new BadRequest(this.INCORRECT_CREDENTIALS_ERROR);
        }
        const payload = JWTPayloadFactory.from(client, user.entity);

        //Password hash used as a unique user secret, KISS, or whatever.
        return jwt.sign({ payload }, user.passwordHash, { expiresIn: this.TOKEN_EXPIRATION_TIME });
    }

    public async authorizeUser(client: string, token: string, permissionRequired: Array<string>): Promise<boolean> {
        try {
            const payload = JWTPayloadFactory.fromToken(token);
            const user = await this.userService.getByKey(client, payload.usr);
            if (user === null) {
                throw new BadRequest(this.USER_NOT_FOUND_ERROR);
            }
            jwt.verify(token, user.passwordHash);
            return permissionRequired.every(permission =>
                user.groupObjects.flatMap(group => group.permissions).includes(permission),
            );
        } catch (error) {
            if (error instanceof JsonWebTokenError || error instanceof TokenExpiredError) {
                throw new HttpError(403, this.INVALID_JSON_WEB_TOKEN);
            }
            throw error;
        }
    }
}
