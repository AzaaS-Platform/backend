import { GroupService } from '../../../src/service/GroupService';
import { Group } from '../../../src/type/Group';
import { DynamoDB } from 'aws-sdk';
import { DatabaseAccessor } from '../../../src/database/DatabaseAccessor';
import { UserService } from '../../../src/service/UserService';
import { User } from '../../../src/type/User';
import { InternalServerError } from '../../../src/error/InternalServerError';
import { DbItem } from '../../../src/database/DbItem';

const CLIENT_HASH = 'ba3778fd-f8fd-4a16-8922-9a173d1660b8';

const GROUP_1_HASH = '1461ad76-9133-4b32-8314-2d1f13364ae9';
const GROUP_1_DATA = new DbItem({
    client: CLIENT_HASH,
    entity: GROUP_1_HASH,
    permissions: {
        type: 'String',
        values: Array<string>('permission1'),
        wrapperName: 'Set',
    } as DynamoDB.DocumentClient.StringSet,
});
const GROUP_1 = new Group(CLIENT_HASH, GROUP_1_HASH, Array<string>('permission1'));

const GROUP_2_HASH = '44c96464-a7b9-4784-9437-692346893905';
const GROUP_2_DATA = new DbItem({
    client: CLIENT_HASH,
    entity: GROUP_2_HASH,
    permissions: {
        type: 'String',
        values: Array<string>('permission2', 'permission3'),
        wrapperName: 'Set',
    } as DynamoDB.DocumentClient.StringSet,
});
const GROUP_2 = new Group(CLIENT_HASH, GROUP_2_HASH, Array<string>('permission2', 'permission3'));

const EMPTY_USER_HASH = 'b9c9ce4e-3df0-4b7b-9f25-df86e12e574b';
const EMPTY_USER_DATA = new DbItem({
    client: CLIENT_HASH,
    entity: EMPTY_USER_HASH,
});
const EMPTY_USER = new User(CLIENT_HASH, EMPTY_USER_HASH, Array<string>(), Array<Group>());

const MULTIPLE_USER_HASH = '3c83b316-3904-498b-a5e6-e1c6c7b217d6';
const MULTIPLE_USER_DATA = new DbItem({
    client: CLIENT_HASH,
    entity: MULTIPLE_USER_HASH,
    groups: {
        type: 'String',
        values: Array<string>(GROUP_1_HASH, GROUP_2_HASH),
        wrapperName: 'Set',
    } as DynamoDB.DocumentClient.StringSet,
});
const MULTIPLE_USER = new User(
    CLIENT_HASH,
    MULTIPLE_USER_HASH,
    Array<string>(GROUP_1_HASH, GROUP_2_HASH),
    Array<Group>(GROUP_1, GROUP_2),
);

const NON_EXISTING_GROUP_HASH = '7430e23f-1612-496c-a2cc-b0719f76850a';
const BROKEN_USER_HASH = '61db4f42-08ff-4ba6-ba20-79d4010097cf';
const BROKEN_USER_DATA = new DbItem({
    client: CLIENT_HASH,
    entity: BROKEN_USER_HASH,
    groups: {
        type: 'String',
        values: Array<string>(GROUP_1_HASH, GROUP_2_HASH, NON_EXISTING_GROUP_HASH),
        wrapperName: 'Set',
    } as DynamoDB.DocumentClient.StringSet,
});

const MOCK_GET_ITEM_BY_KEY = async (
    partitionKey: string,
    sortKey: string,
    entryType: string,
): Promise<DbItem | null> => {
    if (partitionKey === CLIENT_HASH && sortKey === GROUP_1_HASH && entryType === 'group') return GROUP_1_DATA;
    if (partitionKey === CLIENT_HASH && sortKey === GROUP_2_HASH && entryType === 'group') return GROUP_2_DATA;
    if (partitionKey === CLIENT_HASH && sortKey === EMPTY_USER_HASH && entryType === 'user') return EMPTY_USER_DATA;
    if (partitionKey === CLIENT_HASH && sortKey === MULTIPLE_USER_HASH && entryType === 'user')
        return MULTIPLE_USER_DATA;
    if (partitionKey === CLIENT_HASH && sortKey === BROKEN_USER_HASH && entryType === 'user') return BROKEN_USER_DATA;
    return null;
};

beforeEach(() => {
    process.env.STAGE = 'test';
    process.env.REGION = 'eu-central-1';
});

test('user service returns user with no groups correctly ', async () => {
    // given
    const databaseAccessor = new DatabaseAccessor();
    const groupService = new GroupService(databaseAccessor);
    const userService = new UserService(databaseAccessor, groupService);

    databaseAccessor.getItemByKeys = MOCK_GET_ITEM_BY_KEY;

    // when
    const actual = await userService.getUserByKey(CLIENT_HASH, EMPTY_USER_HASH);

    // then
    expect(actual).toEqual(EMPTY_USER);
});

test('user service returns user with multiple groups correctly ', async () => {
    // given
    const databaseAccessor = new DatabaseAccessor();
    const groupService = new GroupService(databaseAccessor);
    const userService = new UserService(databaseAccessor, groupService);

    databaseAccessor.getItemByKeys = MOCK_GET_ITEM_BY_KEY;

    // when
    const actual = await userService.getUserByKey(CLIENT_HASH, MULTIPLE_USER_HASH);

    // then
    expect(actual).toEqual(MULTIPLE_USER);
});

test('user service throws error when user is in a non-existing group', async () => {
    // given
    const databaseAccessor = new DatabaseAccessor();
    const groupService = new GroupService(databaseAccessor);
    const userService = new UserService(databaseAccessor, groupService);

    databaseAccessor.getItemByKeys = MOCK_GET_ITEM_BY_KEY;

    // when
    try {
        await userService.getUserByKey(CLIENT_HASH, BROKEN_USER_HASH);
    } catch (e) {
        // then
        expect(e.message).toEqual('user belongs to non-existing group');
        expect((e as InternalServerError).code).toEqual(500);
    }
    expect.assertions(2);
});
