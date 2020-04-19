import {DatabaseAccessor} from "../DatabaseAccessor";
import {Group} from "../type/Group";
import {DbMapping} from "../DbMapping";

export class GroupService {
    constructor(private databaseAccessor: DatabaseAccessor) {
    }

    async getGroupByKey(client: String, key: String): Promise<Group | null> {
        const map = await this.databaseAccessor.getEntityByKey(`${client}:group:${key}`);

        if (map != null) {
            return new Group(map[DbMapping.id], map[DbMapping.permissions])
        } else {
            return null
        }
    }
}