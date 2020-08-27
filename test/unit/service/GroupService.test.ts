import { GroupService } from '../../../src/service/GroupService';
import { Group } from '../../../src/model/Group';
import { DatabaseAccessor } from '../../../src/database/DatabaseAccessor';
import { DbItem } from '../../../src/database/DbItem';
import { BadRequest } from '../../../src/error/BadRequest';
import { DbMappingConstants as DB } from '../../../src/database/DbMappingConstants';
import { DatabaseAccessorTestUtils as DbUtils } from '../../db/DatabaseAccessorTestUtils';

const CLIENT_HASH = 'ac7c5306-e33c-4e1a-8643-875c1c7917d4';

const EMPTY_GROUP_HASH = '16fc3362-5751-4eca-8478-69e1434cbbf8';
const EMPTY_GROUP = new Group(CLIENT_HASH, EMPTY_GROUP_HASH, Array<string>());
const EMPTY_GROUP_DATA = new DbItem({
    client: CLIENT_HASH + DB.GROUP_TYPE_SUFFIX,
    entity: EMPTY_GROUP_HASH,
});

const ONE_GROUP_HASH = '92663fc0-b18b-4c99-ad26-f130cc01014b';
const ONE_GROUP = new Group(CLIENT_HASH, ONE_GROUP_HASH, Array<string>('permission1'));
const ONE_GROUP_DATA = new DbItem({
    client: CLIENT_HASH + DB.GROUP_TYPE_SUFFIX,
    entity: ONE_GROUP_HASH,
    permissions: Array<string>('permission1'),
});

const MULTIPLE_GROUP_HASH = 'b36f3d80-6217-47ef-954c-efc1d4073646';
const MULTIPLE_GROUP = new Group(CLIENT_HASH, MULTIPLE_GROUP_HASH, Array<string>('permission1', 'permission2'));
const MULTIPLE_GROUP_DATA = new DbItem({
    client: CLIENT_HASH + DB.GROUP_TYPE_SUFFIX,
    entity: MULTIPLE_GROUP_HASH,
    permissions: Array<string>('permission1', 'permission2'),
});

const INVALID_GROUP_HASH = 'e031066d-e3ec-4aaf-b929-91051ac275a4';

const MOCK_GET_ITEM_BY_KEY = async (
    partitionKey: string,
    sortKey: string,
    entryType: string,
): Promise<DbItem | null> => {
    if (partitionKey === CLIENT_HASH) {
        if (entryType === DB.GROUP_TYPE) {
            if (sortKey === EMPTY_GROUP_HASH) return EMPTY_GROUP_DATA;
            if (sortKey === ONE_GROUP_HASH) return ONE_GROUP_DATA;
            if (sortKey === MULTIPLE_GROUP_HASH) return MULTIPLE_GROUP_DATA;
        }
    }
    return null;
};

const MULTIPLE_GROUP_ITEMS = new Array<Group>(EMPTY_GROUP, ONE_GROUP, MULTIPLE_GROUP);
const MULTIPLE_GROUP_DATA_ITEMS = new Array<DbItem>(EMPTY_GROUP_DATA, ONE_GROUP_DATA, MULTIPLE_GROUP_DATA);

const MOCK_GET_ITEMS_PARTITION_KEY = async (partitionKey: string, entryType: string): Promise<Array<DbItem> | null> => {
    if (partitionKey === CLIENT_HASH && entryType === 'group') return MULTIPLE_GROUP_DATA_ITEMS;
    return null;
};

const BAD_REQUEST_CANNOT_OVERWRITE = new BadRequest('cannot overwrite item');
const BAD_REQUEST_ITEM_DOES_NOT_EXIST = new BadRequest('item does not exist');

beforeEach(() => {
    process.env.STAGE = 'test';
    process.env.REGION = 'eu-central-1';
});

test('group service returns group with no permissions', async () => {
    // given
    const databaseAccessor = new DatabaseAccessor();
    const groupService = new GroupService(databaseAccessor);

    databaseAccessor.getItemByKeys = MOCK_GET_ITEM_BY_KEY;

    // when
    const actual = await groupService.getByKey(CLIENT_HASH, EMPTY_GROUP_HASH);

    // then
    expect(actual).toEqual(EMPTY_GROUP);
});

test('group service returns group with one permission', async () => {
    // given
    const databaseAccessor = new DatabaseAccessor();
    const groupService = new GroupService(databaseAccessor);

    databaseAccessor.getItemByKeys = MOCK_GET_ITEM_BY_KEY;

    // when
    const actual = await groupService.getByKey(CLIENT_HASH, ONE_GROUP_HASH);

    // then
    expect(actual).toEqual(ONE_GROUP);
});

test('group service returns group with multiple permissions', async () => {
    // given
    const databaseAccessor = new DatabaseAccessor();
    const groupService = new GroupService(databaseAccessor);

    databaseAccessor.getItemByKeys = MOCK_GET_ITEM_BY_KEY;

    // when
    const actual = await groupService.getByKey(CLIENT_HASH, MULTIPLE_GROUP_HASH);

    // then
    expect(actual).toEqual(MULTIPLE_GROUP);
});

test('group service returns null when group is not found', async () => {
    // given
    const databaseAccessor = new DatabaseAccessor();
    const groupService = new GroupService(databaseAccessor);

    databaseAccessor.getItemByKeys = MOCK_GET_ITEM_BY_KEY;

    // when
    const actual = await groupService.getByKey(CLIENT_HASH, INVALID_GROUP_HASH);

    // then
    expect(actual).toBeNull();
});

test('group service returns all groups', async () => {
    //given
    const databaseAccessor = new DatabaseAccessor();
    const groupService = new GroupService(databaseAccessor);

    databaseAccessor.getItemsPartitionKey = MOCK_GET_ITEMS_PARTITION_KEY;

    //when
    const actual = await groupService.getAll(CLIENT_HASH);

    //then
    expect(actual).toEqual(MULTIPLE_GROUP_ITEMS);
});

test('group service cannot add role because it already exists', async () => {
    //given
    const databaseAccessor = new DatabaseAccessor();
    const groupService = new GroupService(databaseAccessor);

    databaseAccessor.put = async (): Promise<void> => {
        throw DbUtils.ERROR_CONDITIONAL_REQUEST_FAILED;
    };

    //when
    const actual = groupService.add(ONE_GROUP);

    //then
    await expect(actual).rejects.toEqual(BAD_REQUEST_CANNOT_OVERWRITE);
});

test('group service cannot edit role because it does not exist', async () => {
    //given
    const databaseAccessor = new DatabaseAccessor();
    const groupService = new GroupService(databaseAccessor);

    databaseAccessor.put = async (): Promise<void> => {
        throw DbUtils.ERROR_CONDITIONAL_REQUEST_FAILED;
    };

    //when
    const actual = groupService.modify(ONE_GROUP);

    //then
    await expect(actual).rejects.toEqual(BAD_REQUEST_ITEM_DOES_NOT_EXIST);
});

// these should really have its own test class but seeing like all mocks are already here...
test('DbItem created from empty Group matches expected', () => {
    //when
    const actual = EMPTY_GROUP.toDbItem();

    //then
    expect(actual).toEqual(EMPTY_GROUP_DATA);
});

test('DbItem created from multiple Group matches expected', () => {
    //when
    const actual = MULTIPLE_GROUP.toDbItem();

    //then
    expect(actual).toEqual(MULTIPLE_GROUP_DATA);
});
