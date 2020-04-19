import {DatabaseAccessor} from "../DatabaseAccessor";
import {User} from "../type/User";
import {Group} from "../type/Group";
import {GroupService} from "./GroupService";
import {DynamoDB} from 'aws-sdk'
import {DbMapping} from "../DbMapping";

export class UserService {
    constructor(private databaseAccessor: DatabaseAccessor, private groupService: GroupService) {
    }

    async getUserByKey(client: String, key: String): Promise<User | null> {
        const map = await this.databaseAccessor.getEntityByKey(`${client}:user:${key}`);

        if (map != null) {
            const groupStrings = ((map[DbMapping.groups] as DynamoDB.DocumentClient.StringSet).values as Array<String>);
            const groups = await Promise.all(
                groupStrings
                    .map(async (group) => {
                        return (await this.groupService.getGroupByKey(client, group)) as Group;
                    })
            );
            return new User(map[DbMapping.id], groups)
        } else {
            return null
        }
    }
}