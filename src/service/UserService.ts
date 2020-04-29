import { DatabaseAccessor } from '../database/DatabaseAccessor';
import { User } from '../type/User';
import { Group } from '../type/Group';
import { GroupService } from './GroupService';
import { DynamoDB } from 'aws-sdk';
import { DbMappingConstants } from '../database/DbMappingConstants';
import { InternalServerError } from '../error/InternalServerError';
import { DbItem } from '../database/DbItem';

export class UserService {
    constructor(private databaseAccessor: DatabaseAccessor, private groupService: GroupService) {}

    async getUserByKey(client: string, key: string): Promise<User | null> {
        const item = await this.databaseAccessor.getItemByKeys(client, key, 'user');

        if (item != null) {
            const groupStrings = UserService.getGroupsArray(item);
            return new User(item.get(DbMappingConstants.ENTITY), await this.getUserGroups(client, groupStrings));
        } else {
            return null;
        }
    }

    private async getUserGroups(client: string, groupStrings: Array<string>): Promise<Array<Group>> {
        const groups = await Promise.all(
            groupStrings.map(group => {
                return this.groupService.getGroupByKey(client, group);
            }),
        );
        if (groups.includes(null)) throw new InternalServerError('user belongs to non-existing group');
        return groups.filter(it => it != null) as Array<Group>;
    }

    private static getGroupsArray(item: DbItem): Array<string> {
        if (!item.has(DbMappingConstants.GROUPS)) {
            return new Array<string>();
        } else {
            return (item.get(DbMappingConstants.GROUPS) as DynamoDB.DocumentClient.StringSet).values;
        }
    }
}
