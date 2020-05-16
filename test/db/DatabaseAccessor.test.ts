import {DatabaseAccessor} from '../../src/database/DatabaseAccessor';
import {DynamoDB} from 'aws-sdk';
import {DbItem} from '../../src/database/DbItem';

const CLIENT_HASH = '232fe104-13e8-4fb7-8d01-d3cdf37d3b6b';

beforeEach(() => {
    process.env.STAGE = 'test';
    process.env.REGION = 'eu-central-1';
});

test('database accessor reads pre-set group without permissions', async () => {
    // given
    const hash = '145164d9-4904-4cc8-b73c-def9a7906546';
    const expected = new DbItem({
        client: CLIENT_HASH,
        entity: hash,
    });
    const databaseAccessor = new DatabaseAccessor();

    // when
    const actual = await databaseAccessor.getItemByKeys(CLIENT_HASH, hash, 'group');

    // then
    expect(actual).toEqual(expected);
});

test('database accessor reads pre-set group with one permission', async () => {
    // given
    const hash = '3a1bfcd6-2a5e-44e4-89c4-c13abe869b8b';
    const expected = new DbItem({
        client: CLIENT_HASH,
        entity: hash,
        permissions: {
            type: 'String',
            values: Array<string>('permission1'),
            wrapperName: 'Set',
        } as DynamoDB.DocumentClient.StringSet,
    });
    const databaseAccessor = new DatabaseAccessor();

    // when
    const actual = await databaseAccessor.getItemByKeys(CLIENT_HASH, hash, 'group');

    // then
    expect(actual).toEqual(expected);
});

test('database accessor reads pre-set group with multiple permissions', async () => {
    // given
    const hash = 'c5c16cc5-c79e-42f9-beef-2e7f7ec5585d';
    const expected = new DbItem({
        client: CLIENT_HASH,
        entity: hash,
        permissions: {
            type: 'String',
            values: Array<string>('permission1', 'permission2'),
            wrapperName: 'Set',
        } as DynamoDB.DocumentClient.StringSet,
    });
    const databaseAccessor = new DatabaseAccessor();

    // when
    const actual = await databaseAccessor.getItemByKeys(CLIENT_HASH, hash, 'group');

    // then
    expect(actual).toEqual(expected);
});

test('database accessor reads pre-set user properly', async () => {
    // given
    const hash = '69290d1a-e797-440c-870c-98fffdc921fd';
    const expected = new DbItem({
        client: CLIENT_HASH,
        entity: hash,
        groups: {
            type: 'String',
            values: Array<string>('63ec9070-ef3d-45f1-83e7-dc0f9c8556bc', 'c5fc2be7-10e2-4ddb-8998-8111bb08e3e4'),
            wrapperName: 'Set',
        } as DynamoDB.DocumentClient.StringSet,
    });
    const databaseAccessor = new DatabaseAccessor();

    // when
    const actual = await databaseAccessor.getItemByKeys(CLIENT_HASH, hash, 'user');

    // then
    expect(actual).toEqual(expected);
});


test('database accessor reads all pre-set items', async () => {
    //given
    const hash_empty_group = '145164d9-4904-4cc8-b73c-def9a7906546';
    const hash_one_group = '3a1bfcd6-2a5e-44e4-89c4-c13abe869b8b';
    const hash_multiple_group = 'c5c16cc5-c79e-42f9-beef-2e7f7ec5585d';

    const empty_group = new DbItem({
        client: CLIENT_HASH,
        entity: hash_empty_group,
    });

    const one_group = new DbItem({
        client: CLIENT_HASH,
        entity: hash_one_group,
        permissions: {
            type: 'String',
            values: Array<string>('permission1'),
            wrapperName: 'Set',
        } as DynamoDB.DocumentClient.StringSet,
    });

    const multiple_group = new DbItem({
        client: CLIENT_HASH,
        entity: hash_multiple_group,
        permissions: {
            type: 'String',
            values: Array<string>('permission1', 'permission2'),
            wrapperName: 'Set',
        } as DynamoDB.DocumentClient.StringSet,
    });

    const expected = new Array<DbItem>(empty_group, one_group, multiple_group);
    const databaseAccessor = new DatabaseAccessor();

    //when
    const actual = await databaseAccessor.getItemsPartitionKey(CLIENT_HASH, 'group');

    //then
    expect(actual).toEqual(expected);
});

