import { DatabaseAccessor } from '../database/DatabaseAccessor';
import { User } from '../model/User';
import { Group } from '../model/Group';
import { GroupService } from './GroupService';
import { InternalServerError } from '../error/InternalServerError';
import { EntityService } from './EntityService';
import { DbMappingConstants as DB, DbMappingConstants } from '../database/DbMappingConstants';
import { UserFactory } from '../model/factory/UserFactory';
import { BadRequest } from '../error/BadRequest';

export class UserService extends EntityService {
    constructor(databaseAccessor: DatabaseAccessor, private groupService: GroupService) {
        super(databaseAccessor);
    }

    /**
     * @param client - Tenant ID
     * @param key - User ID
     * @return User object if user was found, otherwise null
     */
    async getByKey(client: string, key: string): Promise<User | null> {
        const item = await this.databaseAccessor.getItemByKeys(client, key, DbMappingConstants.USER_TYPE);

        if (item != null) {
            const user = UserFactory.fromDbItem(item);
            user.populateGroups(await this.getUserGroups(user));
            return user;
        } else {
            return null;
        }
    }

    /**
     * Warning: If you can, please use #UserService.getByKey. This one is an expensive operation.
     * @param client - tenant ID
     * @param username - username of the user to get
     * @return User object if user was found, otherwise null
     */
    async getByUsername(client: string, username: string): Promise<User | null> {
        const users = await this.getAll(client);
        const usersWithUsername = users.filter(user => user.username === username);

        if (usersWithUsername.length > 1) {
            throw new InternalServerError('Multiple users with the same name in database. Incorrect state.');
        }

        if (usersWithUsername.length === 0) {
            return null;
        }
        return usersWithUsername[0];
    }

    async getAll(client: string): Promise<Array<User>> {
        const items = await this.databaseAccessor.getItemsByPartitionKey(client, DbMappingConstants.USER_TYPE);

        if (items != null) {
            return await Promise.all(
                items.map(async it => {
                    const user = UserFactory.fromDbItem(it);
                    user.populateGroups(await this.getUserGroups(user));
                    return user;
                }),
            );
        } else {
            return new Array<User>();
        }
    }

    async add(entity: User): Promise<User> {
        const user = await this.getByUsername(entity.client, entity.username);
        if (user !== null) {
            throw new BadRequest('User already exist.');
        }
        entity.populateGroups(await this.getUserGroups(entity));
        super.add(entity);
        return entity;
    }

    async modify(entity: User): Promise<void> {
        entity.populateGroups(await this.getUserGroups(entity));
        return super.modify(entity);
    }

    async delete(client: string, id: string): Promise<void> {
        return this.deleteImpl(client, id, DB.USER_TYPE_SUFFIX);
    }

    public async getUserGroups(user: User): Promise<Array<Group>> {
        const groups = await Promise.all(
            user.groups.map(group => {
                return this.groupService.getByKey(user.client, group);
            }),
        );
        if (groups.includes(null)) throw new InternalServerError('User belongs to non-existing group.');
        return groups.filter(it => it != null) as Array<Group>;
    }
}
