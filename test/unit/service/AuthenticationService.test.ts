import { DatabaseAccessor } from '../../../src/database/DatabaseAccessor';
import { GroupService } from '../../../src/service/GroupService';
import { UserService } from '../../../src/service/UserService';
import { AuthenticationService } from '../../../src/service/AuthenticationService';
import { PasswordUtils } from '../../../src/utils/PasswordUtils';
import { User } from '../../../src/model/User';
import { Unauthorized } from '../../../src/error/Unauthorized';
import * as speakeasy from 'speakeasy';
import { DbMappingConstants } from '../../../src/database/DbMappingConstants';
import { Group } from '../../../src/model/Group';
import { JsonWebTokenError } from 'jsonwebtoken';

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

test('authentication service correctly verifies user permissions', async () => {
    // given
    const databaseAccessor = new DatabaseAccessor();
    const groupService = new GroupService(databaseAccessor);
    const userService = new UserService(databaseAccessor, groupService);
    const authenticationService = new AuthenticationService(userService);

    const user: User = {
        entity: USER_ID,
        passwordHash: PASSWORD_HASH,
        JWTSecret: JWT_SECRET,
        MFASecret: DbMappingConstants.MFA_NOT_ENABLED_MAGIC_VALUE,
        groupObjects: new Array<Group>(),
    } as User;

    userService.getByUsername = async (_client, _username): Promise<User> => user;
    userService.getByKey = async (_client, _username): Promise<User> => user;

    const token = await authenticationService.generateTokenForUser(user.client, user.username, PASSWORD);
    const result = await authenticationService.checkPermissionsForUser(token, ['test_permission']);

    expect(result).toEqual(false);
});

test('authentication service correctly invalidates user token', async () => {
    // given
    const databaseAccessor = new DatabaseAccessor();
    const groupService = new GroupService(databaseAccessor);
    const userService = new UserService(databaseAccessor, groupService);
    const authenticationService = new AuthenticationService(userService);

    const user: User = {
        entity: USER_ID,
        passwordHash: PASSWORD_HASH,
        JWTSecret: JWT_SECRET,
        MFASecret: DbMappingConstants.MFA_NOT_ENABLED_MAGIC_VALUE,
        groupObjects: new Array<Group>(),
    } as User;

    userService.getByUsername = async (_client, _username): Promise<User> => user;
    userService.getByKey = async (_client, _username): Promise<User> => user;
    userService.modify = async (_user): Promise<void> => {
        if (_user.JWTSecret == JWT_SECRET) {
            fail('JWTSecret should change');
        }
    };

    const token = await authenticationService.generateTokenForUser(user.client, user.username, PASSWORD);
    const result = authenticationService.checkPermissionsForUser(token, ['test_permission']);
    await expect(result).resolves.toEqual(false);

    await authenticationService.invalidateToken(token);
    const resultAfterInvalidation = authenticationService.checkPermissionsForUser(token, ['test_permission']);
    await expect(resultAfterInvalidation).rejects.toEqual(
        new JsonWebTokenError('Invalid Json Web Token. Authorization not given.'),
    );
});

test('authentication service correctly generates MFA secret', async () => {
    // given
    const databaseAccessor = new DatabaseAccessor();
    const groupService = new GroupService(databaseAccessor);
    const userService = new UserService(databaseAccessor, groupService);
    const authenticationService = new AuthenticationService(userService);

    const user: User = {
        entity: USER_ID,
        passwordHash: PASSWORD_HASH,
        JWTSecret: JWT_SECRET,
        MFASecret: DbMappingConstants.MFA_NOT_ENABLED_MAGIC_VALUE,
    } as User;

    userService.getByUsername = async (_client, _username): Promise<User> => user;
    userService.getByKey = async (_client, _username): Promise<User> => user;
    userService.modify = async (user: User): Promise<void> => {
        if (user.MFASecret == MFA_SECRET) {
            fail('User MFA Secret has not been changed.');
        }
        if (user.JWTSecret == JWT_SECRET) {
            fail('JWTSecret should be changed to invalidate tokens.');
        }
    };

    const result = await authenticationService.generateMFASecretForUser(user, 'TokenLabel');

    expect(result).toBeTruthy();
});

test('authentication service correctly checks if user has enabled two factor authentication', async () => {
    // given
    const databaseAccessor = new DatabaseAccessor();
    const groupService = new GroupService(databaseAccessor);
    const userService = new UserService(databaseAccessor, groupService);
    const authenticationService = new AuthenticationService(userService);

    const userWithEnabled2FA: User = {
        entity: USER_ID,
        passwordHash: PASSWORD_HASH,
        JWTSecret: JWT_SECRET,
        MFASecret: 'enabledSecret',
    } as User;

    const userWithDisabled2FA: User = {
        entity: USER_ID,
        passwordHash: PASSWORD_HASH,
        JWTSecret: JWT_SECRET,
        MFASecret: DbMappingConstants.MFA_NOT_ENABLED_MAGIC_VALUE,
    } as User;

    const resultEnabled = await authenticationService.checkMFAEnabledForUser(userWithEnabled2FA);
    expect(resultEnabled).toEqual(true);
    const resultDisabled = await authenticationService.checkMFAEnabledForUser(userWithDisabled2FA);
    expect(resultDisabled).toEqual(false);
});

test('authentication service correctly removes MFA secret', async () => {
    // given
    const databaseAccessor = new DatabaseAccessor();
    const groupService = new GroupService(databaseAccessor);
    const userService = new UserService(databaseAccessor, groupService);
    const authenticationService = new AuthenticationService(userService);

    const user: User = {
        entity: USER_ID,
        passwordHash: PASSWORD_HASH,
        JWTSecret: JWT_SECRET,
        MFASecret: 'Some correct secret',
    } as User;

    userService.getByUsername = async (_client, _username): Promise<User> => user;
    userService.getByKey = async (_client, _username): Promise<User> => user;
    userService.modify = async (user: User): Promise<void> => {
        if (user.MFASecret != DbMappingConstants.MFA_NOT_ENABLED_MAGIC_VALUE) {
            fail('MFASecret should be reset to the ' + DbMappingConstants.MFA_NOT_ENABLED_MAGIC_VALUE);
        }
        if (user.JWTSecret == JWT_SECRET) {
            fail('JWTSecret should be changed to invalidate tokens.');
        }
    };

    const MFAtoken = speakeasy.totp({
        secret: user.MFASecret as string,
        encoding: 'ascii',
    });
    const resultBeforeRemoval = await authenticationService.generateTokenForUser(
        user.client,
        user.username,
        PASSWORD,
        MFAtoken,
    );
    await authenticationService.removeMFAFromUser(user);
    const resultAfterRemoval = await authenticationService.generateTokenForUser(user.client, user.username, PASSWORD);
    expect(resultBeforeRemoval).toBeTruthy();
    expect(resultAfterRemoval).toBeTruthy();
});
