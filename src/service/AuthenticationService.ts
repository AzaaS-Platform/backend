import { UserService } from './UserService';
import * as jwt from 'jsonwebtoken';
import { PasswordUtils } from '../Utils/PasswordUtils';

export class AuthenticationService {
    constructor(private userService: UserService) {}

    public async generateTokenForUser(username: string, passwordHash: string): Promise<string> {
        const user = await this.userService.getByUsername(username);
        if (user === null) {
            throw new Error('User not found.');
        }
        if (!PasswordUtils.validate(passwordHash, user.passwordHash)) {
            throw new Error('Incorrect credentials.');
        }
        const payload = { groups: user.groups, id: user.entity, exp: 16500000 };

        return jwt.sign(payload, 'secret');
    }
}
