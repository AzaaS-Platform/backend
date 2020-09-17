import { Group } from '../Group';
import { v4 as UUID } from 'uuid';
import { GroupDto } from '../dto/GroupDto';
import { DbItem } from '../../database/DbItem';
import { DbMappingConstants as DB } from '../../database/DbMappingConstants';

export class GroupFactory {
    static fromDto(client: string, id: string, group: GroupDto): Group {
        return new Group(client, id, group.permissions as Array<string>);
    }

    static fromDtoNew(client: string, group: GroupDto): Group {
        return new Group(client, UUID(), group.permissions as Array<string>);
    }

    static fromDbItem(item: DbItem): Group {
        return new Group(item.get(DB.CLIENT), item.get(DB.ENTITY), GroupFactory.getPermissionsArray(item));
    }

    private static getPermissionsArray(item: DbItem): Array<string> {
        if (!item.has(DB.PERMISSIONS)) {
            return new Array<string>();
        } else {
            return item.get(DB.PERMISSIONS);
        }
    }
}
