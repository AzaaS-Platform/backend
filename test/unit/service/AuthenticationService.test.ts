import { DatabaseAccessor } from '../../../src/database/DatabaseAccessor';
import { GroupService } from '../../../src/service/GroupService';
import { UserService } from '../../../src/service/UserService';
import { AuthenticationService } from '../../../src/service/AuthenticationService';
import { PasswordUtils } from '../../../src/utils/PasswordUtils';
import { User } from '../../../src/model/User';
import { Unauthorized } from '../../../src/error/Unauthorized';
import * as speakeasy from 'speakeasy';

const CLIENT_ID = 'test-client';
const USER_ID = 'test-user';
const USERNAME = 'username';
const PASSWORD = 'password';
const PASSWORD_HASH = PasswordUtils.hash(PASSWORD);
const JWT_SECRET = 'jwt-secret';
const MFA_SECRET = 'mfa-secret';

beforeEach(() => {
    process.env.STAGE = 'test';
    process.env.REGION = 'eu-central-1';
});

test('authentication service returns token when user passes correct credentials', async () => {
    // given
    const databaseAccessor = new DatabaseAccessor();
    const groupService = new GroupService(databaseAccessor);
    const userService = new UserService(databaseAccessor, groupService);
    const authenticationService = new AuthenticationService(userService);

    userService.getByUsername = async (_client, _username): Promise<User> => {
        return { entity: USER_ID, passwordHash: PASSWORD_HASH, JWTSecret: JWT_SECRET } as User;
    };
    const result = await authenticationService.generateTokenForUser(CLIENT_ID, USERNAME, PASSWORD);

    expect(result).toBeTruthy();
});

test('authentication service returns token when user passes correct credentials with 2FA', async () => {
    // given
    const databaseAccessor = new DatabaseAccessor();
    const groupService = new GroupService(databaseAccessor);
    const userService = new UserService(databaseAccessor, groupService);
    const authenticationService = new AuthenticationService(userService);

    userService.getByUsername = async (_client, _username): Promise<User> => {
        return { entity: USER_ID, passwordHash: PASSWORD_HASH, JWTSecret: JWT_SECRET, MFASecret: MFA_SECRET } as User;
    };
    const result = await authenticationService.generateTokenForUser(
        CLIENT_ID,
        USERNAME,
        PASSWORD,
        speakeasy.totp({
            secret: MFA_SECRET,
            encoding: 'ascii',
        }),
    );

    expect(result).toBeTruthy();
});

test('authentication service throws incorrect credentials error when user passes incorrect credentials with 2FA', async () => {
    // given
    const databaseAccessor = new DatabaseAccessor();
    const groupService = new GroupService(databaseAccessor);
    const userService = new UserService(databaseAccessor, groupService);
    const authenticationService = new AuthenticationService(userService);

    userService.getByUsername = async (_client, _username): Promise<User> => {
        return { entity: USER_ID, passwordHash: PASSWORD_HASH, JWTSecret: JWT_SECRET, MFASecret: MFA_SECRET } as User;
    };
    const result = authenticationService.generateTokenForUser(CLIENT_ID, USERNAME, PASSWORD, '12345');

    await expect(result).rejects.toEqual(new Unauthorized('Incorrect credentials'));
});

test('authentication service throws incorrect credentials error when user passes incorrect credentials', async () => {
    // given
    const databaseAccessor = new DatabaseAccessor();
    const groupService = new GroupService(databaseAccessor);
    const userService = new UserService(databaseAccessor, groupService);
    const authenticationService = new AuthenticationService(userService);

    userService.getByUsername = async (_client, _username): Promise<User> => {
        return { entity: USER_ID, passwordHash: PASSWORD_HASH, JWTSecret: JWT_SECRET } as User;
    };
    const result = authenticationService.generateTokenForUser(CLIENT_ID, USERNAME, 'SomeBadPassword');

    await expect(result).rejects.toEqual(new Unauthorized('Incorrect credentials'));
});

test('authentication service throws incorrect credentials error when user doesnt exist', async () => {
    // given
    const databaseAccessor = new DatabaseAccessor();
    const groupService = new GroupService(databaseAccessor);
    const userService = new UserService(databaseAccessor, groupService);
    const authenticationService = new AuthenticationService(userService);

    userService.getByUsername = async (_client, _username): Promise<User | null> => null;
    const result = authenticationService.generateTokenForUser(CLIENT_ID, USERNAME, PASSWORD);

    await expect(result).rejects.toEqual(new Unauthorized('Incorrect credentials'));
});
