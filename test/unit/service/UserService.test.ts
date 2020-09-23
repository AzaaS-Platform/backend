import { GroupService } from '../../../src/service/GroupService';
import { Group } from '../../../src/model/Group';
import { DatabaseAccessor } from '../../../src/database/DatabaseAccessor';
import { UserService } from '../../../src/service/UserService';
import { User } from '../../../src/model/User';
import { InternalServerError } from '../../../src/error/InternalServerError';
import { DbItem } from '../../../src/database/DbItem';
import { DbMappingConstants as DB } from '../../../src/database/DbMappingConstants';
import { BadRequest } from '../../../src/error/BadRequest';
import { DatabaseAccessorTestUtils as DbUtils } from '../../db/DatabaseAccessorTestUtils';

const CLIENT_HASH = 'ba3778fd-f8fd-4a16-8922-9a173d1660b8';

const GROUP_1_HASH = '1461ad76-9133-4b32-8314-2d1f13364ae9';
const GROUP_1_DATA = new DbItem({
    client: CLIENT_HASH + DB.USER_TYPE_SUFFIX,
    entity: GROUP_1_HASH,
    permissions: Array<string>('permission1'),
});
const GROUP_1 = new Group(CLIENT_HASH, GROUP_1_HASH, Array<string>('permission1'));

const GROUP_2_HASH = '44c96464-a7b9-4784-9437-692346893905';
const GROUP_2_DATA = new DbItem({
    client: CLIENT_HASH + DB.USER_TYPE_SUFFIX,
    entity: GROUP_2_HASH,
    permissions: Array<string>('permission2', 'permission3'),
});
const GROUP_2 = new Group(CLIENT_HASH, GROUP_2_HASH, Array<string>('permission2', 'permission3'));

const EMPTY_USER_HASH = 'b9c9ce4e-3df0-4b7b-9f25-df86e12e574b';
const EMPTY_USER_DATA = new DbItem({
    client: CLIENT_HASH + DB.USER_TYPE_SUFFIX,
    entity: EMPTY_USER_HASH,
    username: 'username',
    passwordHash: 'password',
    isAdmin: false,
});
const EMPTY_USER = new User(
    CLIENT_HASH,
    EMPTY_USER_HASH,
    'username',
    'password',
    Array<string>(),
    false,
    Array<Group>(),
);

const MULTIPLE_USER_HASH = '3c83b316-3904-498b-a5e6-e1c6c7b217d6';
const MULTIPLE_USER_DATA = new DbItem({
    client: CLIENT_HASH + DB.USER_TYPE_SUFFIX,
    entity: MULTIPLE_USER_HASH,
    username: 'username',
    passwordHash: 'password',
    isAdmin: false,
    groups: Array<string>(GROUP_1_HASH, GROUP_2_HASH),
});
const MULTIPLE_USER = new User(
    CLIENT_HASH,
    MULTIPLE_USER_HASH,
    'username',
    'password',
    Array<string>(GROUP_1_HASH, GROUP_2_HASH),
    false,
    Array<Group>(GROUP_1, GROUP_2),
);

const NON_EXISTING_USER_HASH = '4e872002-de74-454b-bfca-0ede9be39d62';

const NON_EXISTING_GROUP_HASH = '7430e23f-1612-496c-a2cc-b0719f76850a';
const BROKEN_USER_HASH = '61db4f42-08ff-4ba6-ba20-79d4010097cf';
const BROKEN_USER_DATA = new DbItem({
    client: CLIENT_HASH + DB.USER_TYPE_SUFFIX,
    entity: BROKEN_USER_HASH,
    username: 'username',
    passwordHash: 'password',
    isAdmin: false,
    groups: Array<string>(GROUP_1_HASH, GROUP_2_HASH, NON_EXISTING_GROUP_HASH),
});

const MOCK_GET_ITEM_BY_KEY = async (
    partitionKey: string,
    sortKey: string,
    entryType: string,
): Promise<DbItem | null> => {
    if (partitionKey === CLIENT_HASH) {
        if (entryType === DB.GROUP_TYPE) {
            if (sortKey === GROUP_1_HASH) return GROUP_1_DATA;
            if (sortKey === GROUP_2_HASH) return GROUP_2_DATA;
        }
        if (entryType === DB.USER_TYPE) {
            if (sortKey === EMPTY_USER_HASH) return EMPTY_USER_DATA;
            if (sortKey === MULTIPLE_USER_HASH) return MULTIPLE_USER_DATA;
            if (sortKey === BROKEN_USER_HASH) return BROKEN_USER_DATA;
        }
    }
    return null;
};

const BAD_REQUEST_CANNOT_OVERWRITE = new BadRequest('User already exist.');
const BAD_REQUEST_ITEM_DOES_NOT_EXIST = new BadRequest('item does not exist');

beforeEach(() => {
    process.env.STAGE = 'test';
    process.env.REGION = 'eu-central-1';
});

test('user service returns user with no groups', async () => {
    // given
    const databaseAccessor = new DatabaseAccessor();
    const groupService = new GroupService(databaseAccessor);
    const userService = new UserService(databaseAccessor, groupService);

    databaseAccessor.getItemByKeys = MOCK_GET_ITEM_BY_KEY;

    // when
    const actual = await userService.getByKey(CLIENT_HASH, EMPTY_USER_HASH);

    // then
    expect(actual).toEqual(EMPTY_USER);
});

test('user service returns user with multiple groups', async () => {
    // given
    const databaseAccessor = new DatabaseAccessor();
    const groupService = new GroupService(databaseAccessor);
    const userService = new UserService(databaseAccessor, groupService);

    databaseAccessor.getItemByKeys = MOCK_GET_ITEM_BY_KEY;

    // when
    const actual = await userService.getByKey(CLIENT_HASH, MULTIPLE_USER_HASH);

    // then
    expect(actual).toEqual(MULTIPLE_USER);
});

test('user service returns null when user is not found', async () => {
    //given
    const databaseAccessor = new DatabaseAccessor();
    const groupService = new GroupService(databaseAccessor);
    const userService = new UserService(databaseAccessor, groupService);

    databaseAccessor.getItemByKeys = MOCK_GET_ITEM_BY_KEY;

    //when
    const actual = await userService.getByKey(CLIENT_HASH, NON_EXISTING_USER_HASH);

    //then
    expect(actual).toEqual(null);
});

test('user service cannot add user because it already exists', async () => {
    //given
    const databaseAccessor = new DatabaseAccessor();
    const groupService = new GroupService(databaseAccessor);
    const userService = new UserService(databaseAccessor, groupService);

    databaseAccessor.put = async (): Promise<void> => {
        throw DbUtils.ERROR_CONDITIONAL_REQUEST_FAILED;
    };

    //when
    const actual = userService.add(EMPTY_USER);

    //then
    await expect(actual).rejects.toEqual(BAD_REQUEST_CANNOT_OVERWRITE);
});

test('user service cannot edit user because it does not exist', async () => {
    //given
    const databaseAccessor = new DatabaseAccessor();
    const groupService = new GroupService(databaseAccessor);
    const userService = new UserService(databaseAccessor, groupService);

    databaseAccessor.put = async (): Promise<void> => {
        throw DbUtils.ERROR_CONDITIONAL_REQUEST_FAILED;
    };

    //when
    const actual = userService.modify(EMPTY_USER);

    //then
    await expect(actual).rejects.toEqual(BAD_REQUEST_ITEM_DOES_NOT_EXIST);
});

test('user service throws error when user is in a non-existing group', async () => {
    // given
    const databaseAccessor = new DatabaseAccessor();
    const groupService = new GroupService(databaseAccessor);
    const userService = new UserService(databaseAccessor, groupService);

    databaseAccessor.getItemByKeys = MOCK_GET_ITEM_BY_KEY;

    // when
    try {
        await userService.getByKey(CLIENT_HASH, BROKEN_USER_HASH);
    } catch (e) {
        // then
        expect(e.message).toEqual('User belongs to non-existing group.');
        expect((e as InternalServerError).code).toEqual(500);
    }
    expect.assertions(2);
});

// these should really have its own test class but seeing like all mocks are already here...
test('DbItem created from empty User contains its groups', () => {
    //when
    const actual = EMPTY_USER.toDbItem();

    //then
    expect(actual).toEqual(EMPTY_USER_DATA);
});

test('DbItem created from User contains its groups', () => {
    //when
    const actual = MULTIPLE_USER.toDbItem();

    //then
    expect(actual).toEqual(MULTIPLE_USER_DATA);
});
