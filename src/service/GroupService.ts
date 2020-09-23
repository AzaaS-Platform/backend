import { DatabaseAccessor } from '../database/DatabaseAccessor';
import { Group } from '../model/Group';
import { InternalServerError } from '../error/InternalServerError';
import { EntityService } from './EntityService';
import { DbMappingConstants as DB } from '../database/DbMappingConstants';
import { GroupFactory } from '../model/factory/GroupFactory';

export class GroupService extends EntityService {
    constructor(databaseAccessor: DatabaseAccessor) {
        super(databaseAccessor);
    }

    async getByKey(client: string, key: string): Promise<Group | null> {
        try {
            const item = await this.databaseAccessor.getItemByKeys(client, key, 'group');

            if (item != null) {
                return GroupFactory.fromDbItem(item);
            } else {
                return null;
            }
        } catch (e) {
            throw new InternalServerError(e.message);
        }
    }

    async getAll(client: string): Promise<Array<Group>> {
        try {
            const items = await this.databaseAccessor.getItemsByPartitionKey(client, 'group');
            if (items != null) {
                return items.map(it => {
                    return GroupFactory.fromDbItem(it);
                });
            } else {
                return new Array<Group>();
            }
        } catch (e) {
            throw new InternalServerError(e.message);
        }
    }

    async delete(client: string, id: string): Promise<void> {
        return super.deleteImpl(client, id, DB.GROUP_TYPE_SUFFIX);
    }
}
