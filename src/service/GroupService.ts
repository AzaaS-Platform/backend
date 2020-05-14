import { DatabaseAccessor } from '../database/DatabaseAccessor';
import { Group } from '../type/Group';
import {BadRequest} from "../error/BadRequest";
import {InternalServerError} from "../error/InternalServerError";

export class GroupService {
    constructor(private databaseAccessor: DatabaseAccessor) {}

    async getGroupByKey(client: string, key: string): Promise<Group | null> {
        const item = await this.databaseAccessor.getItemByKeys(client, key, 'group');

        if (item != null) {
            return Group.fromDbItem(item);
        } else {
            return null;
        }
    }

    async getAllGroups(client: string): Promise<Array<Group>> {
        const item = await this.databaseAccessor.getItemsPartitionKey(client, 'group');

        if (item != null) {
            return item.map(it => {
                return Group.fromDbItem(it);
            });
        } else {
            return new Array<Group>();
        }
    }

    async addGroup(group: Group): Promise<void> {
        try {
            return await this.databaseAccessor.put(group.toDbItem(), false);
        } catch (e) {
            if (e.message === 'The conditional request failed') throw new BadRequest('cannot overwrite item');
            else throw new InternalServerError(e.message);
        }
    }

    async modifyGroup(group: Group): Promise<void> {
        try {
            return await this.databaseAccessor.put(group.toDbItem(), true);
        } catch (e) {
            if (e.message === 'The conditional request failed') throw new BadRequest('item does not exist');
            else throw new InternalServerError(e.message);
        }
    }
}
