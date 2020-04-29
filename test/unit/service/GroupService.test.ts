import { GroupService } from '../../../src/service/GroupService';
import { Group } from '../../../src/type/Group';
import { DatabaseAccessor } from '../../../src/database/DatabaseAccessor';
import { DynamoDB } from 'aws-sdk';
import { DbItem } from '../../../src/database/DbItem';

const CLIENT_HASH = 'ac7c5306-e33c-4e1a-8643-875c1c7917d4';

const EMPTY_GROUP_HASH = '16fc3362-5751-4eca-8478-69e1434cbbf8';
const EMPTY_GROUP_DATA = new DbItem({
    client: CLIENT_HASH,
    entity: EMPTY_GROUP_HASH,
});
const EMPTY_GROUP = new Group(EMPTY_GROUP_HASH, Array<string>());

const ONE_GROUP_HASH = '92663fc0-b18b-4c99-ad26-f130cc01014b';
const ONE_GROUP_DATA = new DbItem({
    client: CLIENT_HASH,
    entity: ONE_GROUP_HASH,
    permissions: {
        type: 'String',
        values: Array<string>('permission1'),
        wrapperName: 'Set',
    } as DynamoDB.DocumentClient.StringSet,
});
const ONE_GROUP = new Group(ONE_GROUP_HASH, Array<string>('permission1'));

const MULTIPLE_GROUP_HASH = 'b36f3d80-6217-47ef-954c-efc1d4073646';
const MULTIPLE_GROUP_DATA = new DbItem({
    client: CLIENT_HASH,
    entity: MULTIPLE_GROUP_HASH,
    permissions: {
        type: 'String',
        values: Array<string>('permission1', 'permission2'),
        wrapperName: 'Set',
    } as DynamoDB.DocumentClient.StringSet,
});
const MULTIPLE_GROUP = new Group(MULTIPLE_GROUP_HASH, Array<string>('permission1', 'permission2'));

const INVALID_GROUP_HASH = 'e031066d-e3ec-4aaf-b929-91051ac275a4';

const MOCK_GET_ITEM_BY_KEY = async (
    partitionKey: string,
    sortKey: string,
    entryType: string,
): Promise<DbItem | null> => {
    if (partitionKey === CLIENT_HASH && sortKey === EMPTY_GROUP_HASH && entryType === 'group') return EMPTY_GROUP_DATA;
    if (partitionKey === CLIENT_HASH && sortKey === ONE_GROUP_HASH && entryType === 'group') return ONE_GROUP_DATA;
    if (partitionKey === CLIENT_HASH && sortKey === MULTIPLE_GROUP_HASH && entryType === 'group')
        return MULTIPLE_GROUP_DATA;
    return null;
};

beforeEach(() => {
    process.env.STAGE = 'test';
    process.env.REGION = 'eu-central-1';
});

test('group service returns group with no permissions ', async () => {
    // given
    const databaseAccessor = new DatabaseAccessor();
    const groupService = new GroupService(databaseAccessor);

    databaseAccessor.getItemByKeys = MOCK_GET_ITEM_BY_KEY;

    // when
    const actual = await groupService.getGroupByKey(CLIENT_HASH, EMPTY_GROUP_HASH);

    // then
    expect(actual).toEqual(EMPTY_GROUP);
});

test('group service returns group with one permission ', async () => {
    // given
    const databaseAccessor = new DatabaseAccessor();
    const groupService = new GroupService(databaseAccessor);

    databaseAccessor.getItemByKeys = MOCK_GET_ITEM_BY_KEY;

    // when
    const actual = await groupService.getGroupByKey(CLIENT_HASH, ONE_GROUP_HASH);

    // then
    expect(actual).toEqual(ONE_GROUP);
});

test('group service returns group with multiple permissions ', async () => {
    // given
    const databaseAccessor = new DatabaseAccessor();
    const groupService = new GroupService(databaseAccessor);

    databaseAccessor.getItemByKeys = MOCK_GET_ITEM_BY_KEY;

    // when
    const actual = await groupService.getGroupByKey(CLIENT_HASH, MULTIPLE_GROUP_HASH);

    // then
    expect(actual).toEqual(MULTIPLE_GROUP);
});

test('group service returns null when group is not found ', async () => {
    // given
    const databaseAccessor = new DatabaseAccessor();
    const groupService = new GroupService(databaseAccessor);

    databaseAccessor.getItemByKeys = MOCK_GET_ITEM_BY_KEY;

    // when
    const actual = await groupService.getGroupByKey(CLIENT_HASH, INVALID_GROUP_HASH);

    // then
    expect(actual).toBeNull();
});
