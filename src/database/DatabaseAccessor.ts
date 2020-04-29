import { DynamoDB } from 'aws-sdk';
import { DbMappingConstants } from './DbMappingConstants';
import { DbItem } from './DbItem';
import { InternalServerError } from '../error/InternalServerError';

export class DatabaseAccessor {
    private DYNAMO_DB = new DynamoDB.DocumentClient({
        region: DatabaseAccessor.determineRegion(),
    });
    private static TABLE_NAME = 'users-groups';

    public async getItemByKey(partitionKey: string, sortKey: string, entryType: string): Promise<DbItem | null> {
        const searchKey: { [key: string]: string } = {};
        searchKey[DbMappingConstants.CLIENT] = `${partitionKey}-${entryType}`;
        searchKey[DbMappingConstants.ENTITY] = sortKey;

        const response = await this.DYNAMO_DB.get({
            TableName: DatabaseAccessor.determineTable(),
            Key: searchKey,
        }).promise();
        if (response.Item != undefined) {
            response.Item[DbMappingConstants.CLIENT] = partitionKey;
            return new DbItem(response.Item);
        } else return null;
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
