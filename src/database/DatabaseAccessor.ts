import { DynamoDB } from 'aws-sdk';
import { DbMappingConstants as DB } from './DbMappingConstants';
import { DbItem } from './DbItem';
import { InternalServerError } from '../error/InternalServerError';

export class DatabaseAccessor {
    private DYNAMO_DB = new DynamoDB.DocumentClient({
        region: DatabaseAccessor.determineRegion(),
    });
    private static TABLE_NAME = 'users-groups';

    public async getItemByKeys(partitionKey: string, sortKey: string, entryType: string): Promise<DbItem | null> {
        const searchKey: { [key: string]: string } = {};
        searchKey[DB.CLIENT] = `${partitionKey}${DB.TYPE_SEPARATOR}${entryType}`;
        searchKey[DB.ENTITY] = sortKey;

        const response = await this.DYNAMO_DB.get({
            TableName: DatabaseAccessor.determineTable(),
            Key: searchKey,
        }).promise();

        if (response.Item != undefined) {
            return new DbItem(response.Item).unwrapSets();
        } else return null;
    }

    public async getItemsPartitionKey(partitionKey: string, entryType: string): Promise<Array<DbItem> | null> {
        const keyConditionExpression = `${DB.CLIENT} = ${DB.CLIENT_VALUE}`;
        const expressionAttributeValues: { [key: string]: string } = {};
        expressionAttributeValues[DB.CLIENT_VALUE] = `${partitionKey}${DB.TYPE_SEPARATOR}${entryType}`;

        const response = await this.DYNAMO_DB.query({
            TableName: DatabaseAccessor.determineTable(),
            KeyConditionExpression: keyConditionExpression,
            ExpressionAttributeValues: expressionAttributeValues,
        }).promise();

        if (response.Items != undefined) {
            return response.Items.map(it => new DbItem(it).unwrapSets());
        } else return null;
    }

    public async put(item: DbItem, overwrite: boolean): Promise<void> {
        let conditionExpression: string;
        if (overwrite) {
            conditionExpression = `attribute_exists(${DB.CLIENT})`;
        } else {
            conditionExpression = `attribute_not_exists(${DB.CLIENT})`;
        }
        const response = await this.DYNAMO_DB.put({
            TableName: DatabaseAccessor.determineTable(),
            Item: item.wrapSets().getMap(),
            ConditionExpression: conditionExpression,
        }).promise();

        if (response.$response.error) {
            throw new InternalServerError('request to DynamoDB failed');
        } else {
            return;
        }
    }

    public async delete(client: string, id: string, suffix: string): Promise<void> {
        const response = await this.DYNAMO_DB.delete({
            TableName: DatabaseAccessor.determineTable(),
            Key: {
                client: client + suffix,
                entity: id,
            },
        }).promise();

        if (response.$response.error) {
            throw new InternalServerError('request to DynamoDB failed');
        } else {
            return;
        }
    }

    private static determineTable(): string {
        const stage = process.env.STAGE;
        if (stage != undefined) {
            return `${DatabaseAccessor.TABLE_NAME}-${stage}`;
        } else {
            throw new InternalServerError('stage variable is missing, cannot determine stage');
        }
    }

    private static determineRegion(): string {
        const region = process.env.REGION;
        if (region != undefined) {
            return region;
        } else {
            throw new InternalServerError('region variable is missing, cannot determine region');
        }
    }
}
