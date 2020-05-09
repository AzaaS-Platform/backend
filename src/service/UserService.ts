import { DatabaseAccessor } from '../database/DatabaseAccessor';
import { User } from '../type/User';
import { Group } from '../type/Group';
import { GroupService } from './GroupService';
import { InternalServerError } from '../error/InternalServerError';

export class UserService {
    constructor(private databaseAccessor: DatabaseAccessor, private groupService: GroupService) {}

    async getUserByKey(client: string, key: string): Promise<User | null> {
        const item = await this.databaseAccessor.getItemByKeys(client, key, 'user');

        if (item != null) {
            const user = User.fromDbItem(item);
            user.populateGroups(await this.getUserGroups(user));
            return user;
        } else {
            return null;
        }
    }

    private async getUserGroups(user: User): Promise<Array<Group>> {
        const groups = await Promise.all(
            user.groupStrings.map(group => {
                return this.groupService.getGroupByKey(user.client, group);
            }),
        );
        if (groups.includes(null)) throw new InternalServerError('user belongs to non-existing group');
        return groups.filter(it => it != null) as Array<Group>;
    }
}
