import { UserService } from './UserService';
import * as jwt from 'jsonwebtoken';
import { PasswordUtils } from '../Utils/PasswordUtils';
import { BadRequest } from '../error/BadRequest';
import { JWTPayloadFactory } from '../model/factory/JWTPayloadFactory';

export class AuthenticationService {
    constructor(private userService: UserService) {}

    public async generateTokenForUser(client: string, username: string, password: string): Promise<string> {
        const user = await this.userService.getByUsername(client, username);
        if (user === null) {
            throw new BadRequest('User not found.');
        }
        if (!PasswordUtils.validate(password, user.passwordHash)) {
            throw new BadRequest('Incorrect credentials.');
        }
        const payload = JWTPayloadFactory.from(
            client,
            user.entity,
            user.groupObjects.flatMap(group => group.permissions),
        );

        //TODO: Remember to implement secrets!
        return jwt.sign(payload.toString(), 'secret');
    }
}
