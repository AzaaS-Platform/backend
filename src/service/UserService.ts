import { DatabaseAccessor } from '../DatabaseAccessor';
import { User } from '../type/User';
import { Group } from '../type/Group';
import { GroupService } from './GroupService';
import { DynamoDB } from 'aws-sdk';
import { DbMapping } from '../DbMapping';
import { InternalServerError } from '../error/InternalServerError';

export class UserService {
    constructor(private databaseAccessor: DatabaseAccessor, private groupService: GroupService) {}

    async getUserByKey(client: string, key: string): Promise<User | null> {
        const map = await this.databaseAccessor.getEntityByKey(`${client}:user:${key}`);

        if (map != null) {
            const groupStrings = (map[DbMapping.groups] as DynamoDB.DocumentClient.StringSet).values as Array<string>;
            return new User(map[DbMapping.id], await this.getUserGroups(client, groupStrings));
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
}
