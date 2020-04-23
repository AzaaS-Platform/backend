import {GroupService} from "../../../src/service/GroupService";
import {Group} from "../../../src/type/Group";
import {DynamoDB} from 'aws-sdk'
import {DatabaseAccessor} from "../../../src/DatabaseAccessor";
import {UserService} from "../../../src/service/UserService";
import {User} from "../../../src/type/User";
import {InternalServerError} from "../../../src/error/InternalServerError";

const CLIENT_HASH = "ba3778fd-f8fd-4a16-8922-9a173d1660b8";

const GROUP_1_HASH = "1461ad76-9133-4b32-8314-2d1f13364ae9";
const GROUP_1_ENTITY = `${CLIENT_HASH}:group:${GROUP_1_HASH}`;
const GROUP_1_DATA = {
    entity: GROUP_1_HASH,
    permissions: ({
        type: 'String',
        values: Array<String>("permission1", "permission2")
    } as DynamoDB.DocumentClient.StringSet)
};
const GROUP_1 = new Group(GROUP_1_HASH, Array<String>("permission1", "permission2"));

const GROUP_2_HASH = "44c96464-a7b9-4784-9437-692346893905";
const GROUP_2_ENTITY = `${CLIENT_HASH}:group:${GROUP_2_HASH}`;
const GROUP_2_DATA = {
    entity: GROUP_2_HASH,
    permissions: ({
        type: 'String',
        values: Array<String>("permission3")
    } as DynamoDB.DocumentClient.StringSet)
};
const GROUP_2 = new Group(GROUP_2_HASH, Array<String>("permission3"));

const USER_HASH = "b9c9ce4e-3df0-4b7b-9f25-df86e12e574b";
const USER_ENTITY = `${CLIENT_HASH}:user:${USER_HASH}`;
const USER_DATA = {
    entity: USER_HASH,
    groups: ({
        type: 'String',
        values: Array<String>(GROUP_1_HASH, GROUP_2_HASH)
    } as DynamoDB.DocumentClient.StringSet)
};
const USER = new User(USER_HASH, Array<Group>(GROUP_1, GROUP_2));

const NON_EXISTING_GROUP_HASH = "7430e23f-1612-496c-a2cc-b0719f76850a";
const BROKEN_USER_HASH = "61db4f42-08ff-4ba6-ba20-79d4010097cf";
const BROKEN_USER_ENTITY = `${CLIENT_HASH}:user:${BROKEN_USER_HASH}`;
const BROKEN_USER_DATA = {
    entity: BROKEN_USER_HASH,
    groups: ({
        type: 'String',
        values: Array<String>(GROUP_1_HASH, GROUP_2_HASH, NON_EXISTING_GROUP_HASH)
    } as DynamoDB.DocumentClient.StringSet)
};

const MOCK_ACCESSOR_METHOD = async (id: String): Promise<{ [key: string]: any } | null> => {
    if (id === USER_ENTITY) return USER_DATA;
    else if (id === BROKEN_USER_ENTITY) return BROKEN_USER_DATA;
    else if (id === GROUP_1_ENTITY) return GROUP_1_DATA;
    else if (id === GROUP_2_ENTITY) return GROUP_2_DATA;
    return null;
};

test('user service returns user correctly ', async () => {
    // given
    const databaseAccessor = new DatabaseAccessor();
    const groupService = new GroupService(databaseAccessor);
    const userService = new UserService(databaseAccessor, groupService);

    databaseAccessor.getEntityByKey = MOCK_ACCESSOR_METHOD;

    // when
    const actual = await userService.getUserByKey(CLIENT_HASH, USER_HASH);

    // then
    expect(actual).toEqual(USER)
});

test('user service throws error when user is in a non-existing group', async () => {
    // given
    const databaseAccessor = new DatabaseAccessor();
    const groupService = new GroupService(databaseAccessor);
    const userService = new UserService(databaseAccessor, groupService);

    databaseAccessor.getEntityByKey = MOCK_ACCESSOR_METHOD;

    // when
    try {
        await userService.getUserByKey(CLIENT_HASH, BROKEN_USER_HASH)
    } catch (e) {
        // then
        expect(e.message).toEqual("user belongs to non-existing group");
        expect((e as InternalServerError).code).toEqual(500);
    }
    expect.assertions(2);
});