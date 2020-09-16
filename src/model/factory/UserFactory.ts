import { v4 as UUID } from 'uuid';
import { DbItem } from '../../database/DbItem';
import { DbMappingConstants as DB } from '../../database/DbMappingConstants';
import { User } from '../User';
import { UserDto } from '../dto/UserDto';

export class UserFactory {
    static fromDto(client: string, id: string, user: UserDto): User {
        return new User(client, id, user.groups as Array<string>);
    }

    static fromDtoNew(client: string, user: UserDto): User {
        return new User(client, UUID(), user.groups as Array<string>);
    }

    static fromDbItem(item: DbItem): User {
        return new User(item.get(DB.CLIENT), item.get(DB.ENTITY), UserFactory.getGroupsArray(item));
    }

    private static getGroupsArray(item: DbItem): Array<string> {
        if (!item.has(DB.GROUPS)) {
            return new Array<string>();
        } else {
            return item.get(DB.GROUPS);
        }
    }
}
