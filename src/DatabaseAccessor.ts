import {DynamoDB} from 'aws-sdk'
import {DbMapping} from "./DbMapping";

export class DatabaseAccessor {

    private static DYNAMO_DB = new DynamoDB.DocumentClient();
    private static TABLE_NAME = "users-groups";

    public async getEntityByKey(key: string): Promise<{ [key: string]: any } | null> {

        const searchKey: { [key: string]: string } = {};
        searchKey[DbMapping.id] = key;

        const promise = await DatabaseAccessor.DYNAMO_DB.get({
            TableName: DatabaseAccessor.TABLE_NAME,
            Key: searchKey
        }).promise();
        if (promise.Item != undefined) {
            promise.Item[DbMapping.id] = DatabaseAccessor.extractId(promise.Item[DbMapping.id]);
            return promise.Item
        } else return null
    }

    private static extractId(entity: String): String {
        return entity.substr(entity.lastIndexOf(':') + 1)
    }
}

export default DatabaseAccessor;