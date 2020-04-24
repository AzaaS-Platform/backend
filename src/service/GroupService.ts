import { DatabaseAccessor } from '../DatabaseAccessor';
import { Group } from '../type/Group';
import { DbMapping } from '../DbMapping';
import { DynamoDB } from 'aws-sdk';

export class GroupService {
    constructor(private databaseAccessor: DatabaseAccessor) {}

    async getGroupByKey(client: string, key: string): Promise<Group | null> {
        const map = await this.databaseAccessor.getEntityByKey(`${client}:group:${key}`);

        if (map != null) {
            return new Group(
                map[DbMapping.id],
                (map[DbMapping.permissions] as DynamoDB.DocumentClient.StringSet).values,
            );
        } else {
            return null;
        }
    }
}
