import { DatabaseAccessor } from '../database/DatabaseAccessor';
import { Group } from '../type/Group';
import { DbMappingConstants } from '../database/DbMappingConstants';
import { DynamoDB } from 'aws-sdk';
import { DbItem } from '../database/DbItem';

export class GroupService {
    constructor(private databaseAccessor: DatabaseAccessor) {}

    async getGroupByKey(client: string, key: string): Promise<Group | null> {
        const item = await this.databaseAccessor.getItemByKeys(client, key, 'group');

        if (item != null) {
            return new Group(item.get(DbMappingConstants.ENTITY), GroupService.getPermissionsArray(item));
        } else {
            return null;
        }
    }

    private static getPermissionsArray(item: DbItem): Array<string> {
        if (!item.has(DbMappingConstants.PERMISSIONS)) {
            return new Array<string>();
        } else {
            return (item.get(DbMappingConstants.PERMISSIONS) as DynamoDB.DocumentClient.StringSet).values;
        }
    }
}
