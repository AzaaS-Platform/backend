import { v4 as UUID } from 'uuid';
import { DbItem } from '../../database/DbItem';
import { DbMappingConstants as DB } from '../../database/DbMappingConstants';
import { User } from '../User';
import { UserDto } from '../dto/UserDto';
import { PasswordUtils } from '../../Utils/PasswordUtils';

export class UserFactory {
    static fromDto(client: string, id: string, user: UserDto): User {
        return new User(
            client,
            id,
            user.username as string,
            PasswordUtils.hash(user.password),
            user.groups as Array<string>,
            false,
        );
    }

    static fromDtoNew(client: string, user: UserDto): User {
        return new User(
            client,
            UUID(),
            user.username as string,
            PasswordUtils.hash(user.password),
            user.groups as Array<string>,
            false,
        );
    }

    static fromDbItem(item: DbItem): User {
        return new User(
            item.get(DB.CLIENT),
            item.get(DB.ENTITY),
            item.get(DB.USERNAME),
            item.get(DB.PASSWORD_HASH),
            UserFactory.getGroupsArray(item),
            item.get(DB.IS_ADMIN),
        );
    }

    private static getGroupsArray(item: DbItem): Array<string> {
        if (!item.has(DB.GROUPS)) {
            return new Array<string>();
        } else {
            return item.get(DB.GROUPS);
        }
    }
}
