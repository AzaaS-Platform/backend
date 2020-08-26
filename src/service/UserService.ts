import { DatabaseAccessor } from '../database/DatabaseAccessor';
import { User } from '../model/User';
import { Group } from '../model/Group';
import { GroupService } from './GroupService';
import { InternalServerError } from '../error/InternalServerError';
import { EntityService } from './EntityService';
import { DbMappingConstants } from '../database/DbMappingConstants';

export class UserService extends EntityService {
    constructor(databaseAccessor: DatabaseAccessor, private groupService: GroupService) {
        super(databaseAccessor);
    }

    async getByKey(client: string, key: string): Promise<User | null> {
        const item = await this.databaseAccessor.getItemByKeys(client, key, DbMappingConstants.USER_TYPE);

        if (item != null) {
            const user = User.fromDbItem(item);
            user.populateGroups(await this.getUserGroups(user));
            return user;
        } else {
            return null;
        }
    }

    async getAll(client: string): Promise<Array<User>> {
        const items = await this.databaseAccessor.getItemsPartitionKey(client, DbMappingConstants.USER_TYPE);

        if (items != null) {
            return await Promise.all(
                items.map(async it => {
                    const user = User.fromDbItem(it);
                    user.populateGroups(await this.getUserGroups(user));
                    return user;
                }),
            );
        } else {
            return new Array<User>();
        }
    }

    async add(entity: User): Promise<void> {
        entity.populateGroups(await this.getUserGroups(entity));
        return super.add(entity);
    }

    async modify(entity: User): Promise<void> {
        entity.populateGroups(await this.getUserGroups(entity));
        return super.modify(entity);
    }

    async delete(entity: User): Promise<void> {
        entity.populateGroups(await this.getUserGroups(entity));
        return super.delete(entity);
    }

    public async getUserGroups(user: User): Promise<Array<Group>> {
        const groups = await Promise.all(
            user.groups.map(group => {
                return this.groupService.getByKey(user.client, group);
            }),
        );
        if (groups.includes(null)) throw new InternalServerError('user belongs to non-existing group');
        return groups.filter(it => it != null) as Array<Group>;
    }
}
