import { DatabaseAccessor } from '../../../src/database/DatabaseAccessor';
import { GroupService } from '../../../src/service/GroupService';
import { UserService } from '../../../src/service/UserService';
import { AuthenticationService } from '../../../src/service/AuthenticationService';
import { PasswordUtils } from '../../../src/Utils/PasswordUtils';
import { User } from '../../../src/model/User';
import { BadRequest } from '../../../src/error/BadRequest';

const CLIENT_ID = 'test-client';
const USER_ID = 'test-user';
const USERNAME = 'username';
const PASSWORD = 'password';
const PASSWORD_HASH = PasswordUtils.hash(PASSWORD);

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
        return { entity: USER_ID, passwordHash: PASSWORD_HASH } as User;
    };
    const result = await authenticationService.generateTokenForUser(CLIENT_ID, USERNAME, PASSWORD);

    expect(result).toBeTruthy();
});

test('authentication service throws incorrect credentials error when user passes incorrect credentials', async () => {
    // given
    const databaseAccessor = new DatabaseAccessor();
    const groupService = new GroupService(databaseAccessor);
    const userService = new UserService(databaseAccessor, groupService);
    const authenticationService = new AuthenticationService(userService);

    userService.getByUsername = async (_client, _username): Promise<User> => {
        return { entity: USER_ID, passwordHash: PASSWORD_HASH } as User;
    };
    const result = authenticationService.generateTokenForUser(CLIENT_ID, USERNAME, 'SomeBadPassword');

    expect(result).rejects.toEqual(new BadRequest('Incorrect credentials'));
});
