import { DatabaseAccessor } from '../database/DatabaseAccessor';
import { Group } from '../model/Group';
import { InternalServerError } from '../error/InternalServerError';
import { EntityService } from './EntityService';

export class GroupService extends EntityService {
    constructor(databaseAccessor: DatabaseAccessor) {
        super(databaseAccessor);
    }

    async getByKey(client: string, key: string): Promise<Group | null> {
        try {
            const item = await this.databaseAccessor.getItemByKeys(client, key, 'group');

            if (item != null) {
                return Group.fromDbItem(item);
            } else {
                return null;
            }
        } catch (e) {
            throw new InternalServerError(e.message);
        }
    }

    async getAll(client: string): Promise<Array<Group>> {
        try {
            const items = await this.databaseAccessor.getItemsPartitionKey(client, 'group');
            if (items != null) {
                return items.map(it => {
                    return Group.fromDbItem(it);
                });
            } else {
                return new Array<Group>();
            }
        } catch (e) {
            throw new InternalServerError(e.message);
        }
    }
}
