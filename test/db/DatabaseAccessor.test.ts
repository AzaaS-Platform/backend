import { DatabaseAccessor } from '../../src/database/DatabaseAccessor';
import { DynamoDB } from 'aws-sdk';
import { DbItem } from '../../src/database/DbItem';
// import { v4 as uuidv4 } from 'uuid';

const PRESET_CLIENT_HASH = '232fe104-13e8-4fb7-8d01-d3cdf37d3b6b';

const PRESET_EMPTY_GROUP_HASH = '145164d9-4904-4cc8-b73c-def9a7906546';
const PRESET_ONE_GROUP_HASH = '3a1bfcd6-2a5e-44e4-89c4-c13abe869b8b';
const PRESET_MULTIPLE_GROUP_HASH = 'c5c16cc5-c79e-42f9-beef-2e7f7ec5585d';
const PRESET_USER_HASH = '69290d1a-e797-440c-870c-98fffdc921fd';

//let RANDOM_CLIENT_HASH: string;

const ERROR_CONDITIONAL_REQUEST_FAILED = new Error('The conditional request failed');

beforeEach(() => {
    process.env.STAGE = 'test';
    process.env.REGION = 'eu-central-1';
    // RANDOM_CLIENT_HASH = uuidv4();
});

test('database accessor reads pre-set group without permissions', async () => {
    // given
    const expected = new DbItem({
        client: PRESET_CLIENT_HASH,
        entity: PRESET_EMPTY_GROUP_HASH,
    });
    const databaseAccessor = new DatabaseAccessor();

    // when
    const actual = await databaseAccessor.getItemByKeys(PRESET_CLIENT_HASH, PRESET_EMPTY_GROUP_HASH, 'group');

    // then
    expect(actual).toEqual(expected);
});

test('database accessor reads pre-set group with one permission', async () => {
    // given
    const expected = new DbItem({
        client: PRESET_CLIENT_HASH,
        entity: PRESET_ONE_GROUP_HASH,
        permissions: {
            type: 'String',
            values: Array<string>('permission1'),
            wrapperName: 'Set',
        } as DynamoDB.DocumentClient.StringSet,
    });
    const databaseAccessor = new DatabaseAccessor();

    // when
    const actual = await databaseAccessor.getItemByKeys(PRESET_CLIENT_HASH, PRESET_ONE_GROUP_HASH, 'group');

    // then
    expect(actual).toEqual(expected);
});

test('database accessor reads pre-set group with multiple permissions', async () => {
    // given
    const expected = new DbItem({
        client: PRESET_CLIENT_HASH,
        entity: PRESET_MULTIPLE_GROUP_HASH,
        permissions: {
            type: 'String',
            values: Array<string>('permission1', 'permission2'),
            wrapperName: 'Set',
        } as DynamoDB.DocumentClient.StringSet,
    });
    const databaseAccessor = new DatabaseAccessor();

    // when
    const actual = await databaseAccessor.getItemByKeys(PRESET_CLIENT_HASH, PRESET_MULTIPLE_GROUP_HASH, 'group');

    // then
    expect(actual).toEqual(expected);
});

test('database accessor reads pre-set user properly', async () => {
    // given
    const expected = new DbItem({
        client: PRESET_CLIENT_HASH,
        entity: PRESET_USER_HASH,
        groups: {
            type: 'String',
            values: Array<string>('63ec9070-ef3d-45f1-83e7-dc0f9c8556bc', 'c5fc2be7-10e2-4ddb-8998-8111bb08e3e4'),
            wrapperName: 'Set',
        } as DynamoDB.DocumentClient.StringSet,
    });
    const databaseAccessor = new DatabaseAccessor();

    // when
    const actual = await databaseAccessor.getItemByKeys(PRESET_CLIENT_HASH, PRESET_USER_HASH, 'user');

    // then
    expect(actual).toEqual(expected);
});

test('database accessor reads all pre-set items', async () => {
    //given

    const emptyGroup = new DbItem({
        client: PRESET_CLIENT_HASH,
        entity: PRESET_EMPTY_GROUP_HASH,
    });

    const oneGroup = new DbItem({
        client: PRESET_CLIENT_HASH,
        entity: PRESET_ONE_GROUP_HASH,
        permissions: {
            type: 'String',
            values: Array<string>('permission1'),
            wrapperName: 'Set',
        } as DynamoDB.DocumentClient.StringSet,
    });

    const multipleGroup = new DbItem({
        client: PRESET_CLIENT_HASH,
        entity: PRESET_MULTIPLE_GROUP_HASH,
        permissions: {
            type: 'String',
            values: Array<string>('permission1', 'permission2'),
            wrapperName: 'Set',
        } as DynamoDB.DocumentClient.StringSet,
    });

    const expected = new Array<DbItem>(emptyGroup, oneGroup, multipleGroup);
    const databaseAccessor = new DatabaseAccessor();

    //when
    const actual = await databaseAccessor.getItemsPartitionKey(PRESET_CLIENT_HASH, 'group');

    //then
    expect(actual).toEqual(expected);
});

test('database accessor cannot add group because it already exists', async () => {
    // given
    const DIFFERENT_ONE_GROUP = new DbItem({
        client: PRESET_CLIENT_HASH,
        entity: PRESET_ONE_GROUP_HASH,
        permissions: {
            type: 'String',
            values: Array<string>('different_permission1'),
            wrapperName: 'Set',
        } as DynamoDB.DocumentClient.StringSet,
    });
    const databaseAccessor = new DatabaseAccessor();

    // when
    const actual = databaseAccessor.put(DIFFERENT_ONE_GROUP, false);

    // then
    await expect(actual).rejects.toEqual(ERROR_CONDITIONAL_REQUEST_FAILED);
});

//test('database accessor adds new group', async () => {
//    // given
//    const hash = uuidv4();
//    const group = new DbItem({
//        client: RANDOM_CLIENT_HASH,
//        entity: hash,
//        permissions: {
//            type: 'String',
//            values: Array<string>('permission_A', 'permission_B'),
//            wrapperName: 'Set',
//        } as DynamoDB.DocumentClient.StringSet,
//    });
//    const databaseAccessor = new DatabaseAccessor();
//
//    // when
//    await databaseAccessor.put(group, false);
//    const savedInDatabase = await databaseAccessor.getItemByKeys(RANDOM_CLIENT_HASH, hash, 'group');
//
//    // then
//    expect(savedInDatabase).toEqual(group);
//});
