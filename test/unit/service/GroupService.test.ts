import {GroupService} from "../../../src/service/GroupService";
import {Group} from "../../../src/type/Group";
import {DatabaseAccessor} from "../../../src/DatabaseAccessor";
import {DynamoDB} from 'aws-sdk'

const CLIENT_HASH = "ac7c5306-e33c-4e1a-8643-875c1c7917d4";
const GROUP_HASH = "16fc3362-5751-4eca-8478-69e1434cbbf8";
const GROUP_ENTITY = `${CLIENT_HASH}:group:${GROUP_HASH}`;
const INVALID_GROUP_HASH = "e031066d-e3ec-4aaf-b929-91051ac275a4";

const GROUP_DATA = {
    entity: GROUP_HASH,
    permissions: ({
        type: 'String',
        values: Array<String>("permission1", "permission2")
    } as DynamoDB.DocumentClient.StringSet)
};
const VALID_GROUP = new Group(GROUP_HASH, Array<String>("permission1", "permission2"));

test('group service returns group correctly ', async () => {
    // given
    const databaseAccessor = new DatabaseAccessor();
    const groupService = new GroupService(databaseAccessor);

    databaseAccessor.getEntityByKey = async (id: String): Promise<{ [key: string]: any } | null> => {
        if (id === GROUP_ENTITY) return GROUP_DATA;
        return null;
    };

    // when
    const actual = await groupService.getGroupByKey(CLIENT_HASH, GROUP_HASH);

    // then
    expect(actual).toEqual(VALID_GROUP)
});

test('group service returns null when group is not found ', async () => {
    // given
    const databaseAccessor = new DatabaseAccessor();
    const groupService = new GroupService(databaseAccessor);

    databaseAccessor.getEntityByKey = async (id: String): Promise<{ [key: string]: any } | null> => {
        if (id === GROUP_ENTITY) return GROUP_DATA;
        return null;
    };

    // when
    const actual = await groupService.getGroupByKey(CLIENT_HASH, INVALID_GROUP_HASH);

    // then
    expect(actual).toBeNull();
});