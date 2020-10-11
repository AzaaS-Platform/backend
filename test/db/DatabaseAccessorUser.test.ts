import { DbItem } from '../../src/database/DbItem';
import { DbMappingConstants, DbMappingConstants as DB } from '../../src/database/DbMappingConstants';
import { DatabaseAccessor } from '../../src/database/DatabaseAccessor';
import { DatabaseAccessorTestUtils as DbUtils } from './DatabaseAccessorTestUtils';
import { v4 as uuidv4 } from 'uuid';

const PRESET_EMPTY_USER_HASH = 'd8ac3a3b-0ddb-4edc-9604-bde1ec738d3d';
const PRESET_ONE_USER_HASH = 'f0cf894a-6135-4d63-906a-78c6c7eeb3a2';
const PRESET_MULTIPLE_USER_HASH = '69290d1a-e797-440c-870c-98fffdc921fd';

const PRESET_EMPTY_USER = new DbItem({
    client: DbUtils.PRESET_CLIENT_HASH + DB.USER_TYPE_SUFFIX,
    entity: PRESET_EMPTY_USER_HASH,
});
const PRESET_ONE_USER = new DbItem({
    client: DbUtils.PRESET_CLIENT_HASH + DB.USER_TYPE_SUFFIX,
    entity: PRESET_ONE_USER_HASH,
    groups: Array<string>('a7f4d813-51f4-4bf5-be2a-65da61387ad8'),
});
const PRESET_MULTIPLE_USER = new DbItem({
    client: DbUtils.PRESET_CLIENT_HASH + DB.USER_TYPE_SUFFIX,
    entity: PRESET_MULTIPLE_USER_HASH,
    groups: Array<string>('63ec9070-ef3d-45f1-83e7-dc0f9c8556bc', 'c5fc2be7-10e2-4ddb-8998-8111bb08e3e4'),
});

let RANDOM_CLIENT_HASH: string;

beforeAll(() => {
    process.env.STAGE = 'test';
    process.env.REGION = 'eu-central-1';
});

beforeEach(() => {
    RANDOM_CLIENT_HASH = uuidv4();
});

const PRESET_USERS = [
    [PRESET_EMPTY_USER_HASH, PRESET_EMPTY_USER],
    [PRESET_ONE_USER_HASH, PRESET_ONE_USER],
    [PRESET_MULTIPLE_USER_HASH, PRESET_MULTIPLE_USER],
];

test.each(PRESET_USERS)('database accessor reads all pre-set users separately: %s', async (hash, expected) => {
    // given
    const databaseAccessor = new DatabaseAccessor();

    // when
    const actual = await databaseAccessor.getItemByKeys(
        DbUtils.PRESET_CLIENT_HASH,
        hash as string,
        DbMappingConstants.USER_TYPE,
    );

    // then
    expect(actual).toEqual(expected);
});

test('database accessor reads all pre-set users at once', async () => {
    //given

    const expected = new Array<DbItem>(PRESET_MULTIPLE_USER, PRESET_EMPTY_USER, PRESET_ONE_USER);
    const databaseAccessor = new DatabaseAccessor();

    //when
    const actual = await databaseAccessor.getItemsByPartitionKey(
        DbUtils.PRESET_CLIENT_HASH,
        DbMappingConstants.USER_TYPE,
    );

    //then
    expected.forEach(it => {
        expect(actual).toContainEqual(it);
    });
});

test('database accessor adds and removes new user', async () => {
    // given
    const hash = uuidv4();
    const user = new DbItem({
        client: RANDOM_CLIENT_HASH + DB.USER_TYPE_SUFFIX,
        entity: hash,
        groups: Array<string>('8ebca6ad-74ea-4c52-ae2d-612f15a5e4ce', 'de3c93f1-bfdf-49ec-a385-87d70595bd92'),
    });
    const databaseAccessor = new DatabaseAccessor();

    // when
    await databaseAccessor.put(user, false);
    const actualAfterInsert = await databaseAccessor.getItemByKeys(
        RANDOM_CLIENT_HASH,
        hash,
        DbMappingConstants.USER_TYPE,
    );

    await databaseAccessor.delete(RANDOM_CLIENT_HASH, hash, DB.USER_TYPE_SUFFIX);
    const actualAfterDelete = await databaseAccessor.getItemByKeys(
        RANDOM_CLIENT_HASH,
        hash,
        DbMappingConstants.USER_TYPE,
    );

    // then
    expect(actualAfterInsert).toEqual(user);
    expect(actualAfterDelete).toBeNull();
});

test('database accessor edits user', async () => {
    // given
    const hash = uuidv4();
    const user = new DbItem({
        client: RANDOM_CLIENT_HASH + DB.USER_TYPE_SUFFIX,
        entity: hash,
        groups: Array<string>('8ebca6ad-74ea-4c52-ae2d-612f15a5e4ce', 'de3c93f1-bfdf-49ec-a385-87d70595bd92'),
    });
    const editedUser = new DbItem({
        client: RANDOM_CLIENT_HASH + DB.USER_TYPE_SUFFIX,
        entity: hash,
        groups: Array<string>('8ebca6ad-74ea-4c52-ae2d-612f15a5e4ce', 'de3c93f1-bfdf-49ec-a385-87d70595bd92'),
    });
    const databaseAccessor = new DatabaseAccessor();

    // when
    await databaseAccessor.put(user, false);
    const actualAfterPut = await databaseAccessor.getItemByKeys(RANDOM_CLIENT_HASH, hash, DbMappingConstants.USER_TYPE);

    await databaseAccessor.put(editedUser, true);
    const actualAfterEdit = await databaseAccessor.getItemByKeys(
        RANDOM_CLIENT_HASH,
        hash,
        DbMappingConstants.USER_TYPE,
    );

    await databaseAccessor.delete(RANDOM_CLIENT_HASH, hash, DB.USER_TYPE_SUFFIX);
    const actualAfterDelete = await databaseAccessor.getItemByKeys(
        RANDOM_CLIENT_HASH,
        hash,
        DbMappingConstants.USER_TYPE,
    );

    // then
    expect(actualAfterPut).toEqual(user);
    expect(actualAfterEdit).toEqual(editedUser);
    expect(actualAfterDelete).toBeNull();
});

test('database accessor cannot add user because it already exists', async () => {
    // given
    const DIFFERENT_ONE_USER = new DbItem({
        client: DbUtils.PRESET_CLIENT_HASH + DB.USER_TYPE_SUFFIX,
        entity: PRESET_ONE_USER_HASH,
        groups: Array<string>('85faa845-0115-4f97-b2c2-d0072ae88a3c'),
    });
    const databaseAccessor = new DatabaseAccessor();

    // when
    const actual = databaseAccessor.put(DIFFERENT_ONE_USER, false);

    // then
    await expect(actual).rejects.toEqual(DbUtils.ERROR_CONDITIONAL_REQUEST_FAILED);
});

test('database accessor cannot edit user because it does not exist', async () => {
    // given
    const hash = uuidv4();
    const user = new DbItem({
        client: RANDOM_CLIENT_HASH + DB.USER_TYPE_SUFFIX,
        entity: hash,
        groups: Array<string>('8ebca6ad-74ea-4c52-ae2d-612f15a5e4ce', 'de3c93f1-bfdf-49ec-a385-87d70595bd92'),
    });
    const databaseAccessor = new DatabaseAccessor();

    // when
    const actual = databaseAccessor.put(user, true);

    // then
    await expect(actual).rejects.toEqual(DbUtils.ERROR_CONDITIONAL_REQUEST_FAILED);
});

// that's just how it is :(
test('database accessor can delete user which does not exist', async () => {
    // given
    const hash = uuidv4();

    const databaseAccessor = new DatabaseAccessor();

    // when
    const actual = databaseAccessor.delete(RANDOM_CLIENT_HASH, hash, DB.USER_TYPE_SUFFIX);

    // then
    await expect(actual).resolves.toBeUndefined();
});
