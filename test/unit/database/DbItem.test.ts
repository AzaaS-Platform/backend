import { DatabaseAccessorTestUtils as DbUtils } from '../../db/DatabaseAccessorTestUtils';
import { DbMappingConstants as DB } from '../../../src/database/DbMappingConstants';
import { TestUtils } from '../../TestUtils';
import { DbItem } from '../../../src/database/DbItem';

const SOME_HASH = '17befd28-3d04-414b-b889-856c9adfb12a';

let UNWRAPPED_ITEM: DbItem;
let WRAPPED_ITEM: DbItem;

beforeEach(() => {
    UNWRAPPED_ITEM = new DbItem({
        client: DbUtils.PRESET_CLIENT_HASH + DB.GROUP_TYPE_SUFFIX,
        entity: SOME_HASH,
        permissions: Array<string>('permission1', 'permission2'),
    });

    WRAPPED_ITEM = new DbItem({
        client: DbUtils.PRESET_CLIENT_HASH + DB.GROUP_TYPE_SUFFIX,
        entity: SOME_HASH,
        permissions: TestUtils.arrayToDdbStringSet(Array<string>('permission1', 'permission2')),
    });
});

test('DbItem unwraps DynamoDB Set', () => {
    //when
    const actual = WRAPPED_ITEM.unwrapSets();

    //then
    expect(actual).toEqual(UNWRAPPED_ITEM);
});

test('DbItem wraps DynamoDB Set', () => {
    //when
    const actual = UNWRAPPED_ITEM.wrapSets();

    //then
    expect(actual).toEqual(WRAPPED_ITEM);
});
