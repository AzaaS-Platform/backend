import { DatabaseAccessor } from '../../src/database/DatabaseAccessor';
import { DbItem } from '../../src/database/DbItem';
import { v4 as uuidv4 } from 'uuid';
import { DbMappingConstants as DB } from '../../src/database/DbMappingConstants';
import { DatabaseAccessorTestUtils as DbUtils } from './DatabaseAccessorTestUtils';

const PRESET_EMPTY_GROUP_HASH = '145164d9-4904-4cc8-b73c-def9a7906546';
const PRESET_ONE_GROUP_HASH = '3a1bfcd6-2a5e-44e4-89c4-c13abe869b8b';
const PRESET_MULTIPLE_GROUP_HASH = 'c5c16cc5-c79e-42f9-beef-2e7f7ec5585d';

const PRESET_EMPTY_GROUP = new DbItem({
    client: DbUtils.PRESET_CLIENT_HASH + DB.GROUP_TYPE_SUFFIX,
    entity: PRESET_EMPTY_GROUP_HASH,
});
const PRESET_ONE_GROUP = new DbItem({
    client: DbUtils.PRESET_CLIENT_HASH + DB.GROUP_TYPE_SUFFIX,
    entity: PRESET_ONE_GROUP_HASH,
    permissions: Array<string>('permission1'),
});
const PRESET_MULTIPLE_GROUP = new DbItem({
    client: DbUtils.PRESET_CLIENT_HASH + DB.GROUP_TYPE_SUFFIX,
    entity: PRESET_MULTIPLE_GROUP_HASH,
    permissions: Array<string>('permission1', 'permission2'),
});

let RANDOM_CLIENT_HASH: string;

beforeAll(() => {
    process.env.STAGE = 'test';
    process.env.REGION = 'eu-central-1';
});

beforeEach(() => {
    RANDOM_CLIENT_HASH = uuidv4();
});

const PRESET_GROUPS = [
    [PRESET_EMPTY_GROUP_HASH, PRESET_EMPTY_GROUP],
    [PRESET_ONE_GROUP_HASH, PRESET_ONE_GROUP],
    [PRESET_MULTIPLE_GROUP_HASH, PRESET_MULTIPLE_GROUP],
];

test.each(PRESET_GROUPS)('database accessor reads all pre-set groups separately: %s', async (hash, expected) => {
    // given
    const databaseAccessor = new DatabaseAccessor();

    // when
    const actual = await databaseAccessor.getItemByKeys(DbUtils.PRESET_CLIENT_HASH, hash as string, DB.GROUP_TYPE);

    // then
    expect(actual).toEqual(expected);
});

test('database accessor reads all pre-set groups at once', async () => {
    //given

    const expected = new Array<DbItem>(PRESET_EMPTY_GROUP, PRESET_ONE_GROUP, PRESET_MULTIPLE_GROUP);
    const databaseAccessor = new DatabaseAccessor();

    //when
    const actual = await databaseAccessor.getItemsByPartitionKey(DbUtils.PRESET_CLIENT_HASH, DB.GROUP_TYPE);

    //then
    expected.forEach(it => {
        expect(actual).toContainEqual(it);
    });
});

test('database accessor adds and removes new group', async () => {
    // given
    const hash = uuidv4();
    const group = new DbItem({
        client: RANDOM_CLIENT_HASH + DB.GROUP_TYPE_SUFFIX,
        entity: hash,
        permissions: Array<string>('permission_A', 'permission_B'),
    });
    const databaseAccessor = new DatabaseAccessor();

    // when
    await databaseAccessor.put(group, false);
    await databaseAccessor.delete(RANDOM_CLIENT_HASH, hash, DB.GROUP_TYPE_SUFFIX);

    const savedInDatabase = await databaseAccessor.getItemByKeys(RANDOM_CLIENT_HASH, hash, DB.GROUP_TYPE);

    // then
    expect(savedInDatabase).toBeNull();
});

test('database accessor edits group', async () => {
    // given
    const hash = uuidv4();
    const group = new DbItem({
        client: RANDOM_CLIENT_HASH + DB.GROUP_TYPE_SUFFIX,
        entity: hash,
        permissions: Array<string>('permission_A', 'permission_B'),
    });
    const editedGroup = new DbItem({
        client: RANDOM_CLIENT_HASH + DB.GROUP_TYPE_SUFFIX,
        entity: hash,
        permissions: Array<string>('permission_C', 'permission_D'),
    });
    const databaseAccessor = new DatabaseAccessor();

    // when
    await databaseAccessor.put(group, false);
    const actualAfterPut = await databaseAccessor.getItemByKeys(RANDOM_CLIENT_HASH, hash, DB.GROUP_TYPE);

    await databaseAccessor.put(editedGroup, true);
    const actualAfterEdit = await databaseAccessor.getItemByKeys(RANDOM_CLIENT_HASH, hash, DB.GROUP_TYPE);

    await databaseAccessor.delete(RANDOM_CLIENT_HASH, hash, DB.GROUP_TYPE_SUFFIX);
    const actualAfterDelete = await databaseAccessor.getItemByKeys(RANDOM_CLIENT_HASH, hash, DB.GROUP_TYPE);

    // then
    expect(actualAfterPut).toEqual(group);
    expect(actualAfterEdit).toEqual(editedGroup);
    expect(actualAfterDelete).toBeNull();
});

test('database accessor cannot add group because it already exists', async () => {
    // given
    const DIFFERENT_ONE_GROUP = new DbItem({
        client: DbUtils.PRESET_CLIENT_HASH + DB.GROUP_TYPE_SUFFIX,
        entity: PRESET_ONE_GROUP_HASH,
        permissions: Array<string>('different_permission1'),
    });
    const databaseAccessor = new DatabaseAccessor();

    // when
    const actual = databaseAccessor.put(DIFFERENT_ONE_GROUP, false);

    // then
    await expect(actual).rejects.toEqual(DbUtils.ERROR_CONDITIONAL_REQUEST_FAILED);
});

test('database accessor cannot edit group because it does not exist', async () => {
    // given
    const hash = uuidv4();
    const group = new DbItem({
        client: RANDOM_CLIENT_HASH + DB.GROUP_TYPE_SUFFIX,
        entity: hash,
        permissions: Array<string>('permission_A', 'permission_B'),
    });
    const databaseAccessor = new DatabaseAccessor();

    // when
    const actual = databaseAccessor.put(group, true);

    // then
    await expect(actual).rejects.toEqual(DbUtils.ERROR_CONDITIONAL_REQUEST_FAILED);
});

// that's just how it is :(
test('database accessor can delete group which does not exist', async () => {
    // given
    const hash = uuidv4();

    const databaseAccessor = new DatabaseAccessor();

    // when
    const actual = databaseAccessor.delete(RANDOM_CLIENT_HASH, hash, DB.GROUP_TYPE);

    // then
    await expect(actual).resolves.toBeUndefined();
});
