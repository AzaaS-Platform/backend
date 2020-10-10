import { Group } from '../Group';
import { v4 as UUID } from 'uuid';
import { GroupRequestDto } from '../dto/request/GroupRequestDto';
import { DbItem } from '../../database/DbItem';
import { DbMappingConstants as DB } from '../../database/DbMappingConstants';
import { GroupResponseDto } from '../dto/response/GroupResponseDto';

export class GroupFactory {
    static fromDto(client: string, id: string, group: GroupRequestDto): Group {
        return new Group(client, id, group.name as string, group.permissions as Array<string>);
    }

    static fromDtoNew(client: string, group: GroupRequestDto): Group {
        return new Group(client, UUID(), group.name as string, group.permissions as Array<string>);
    }

    static fromDbItem(item: DbItem): Group {
        return new Group(
            item.get(DB.CLIENT),
            item.get(DB.ENTITY),
            item.get(DB.GROUP_NAME),
            GroupFactory.getPermissionsArray(item),
        );
    }

    static toResponse(group: Group | null): Group | any {
        if (group === null) return {};
        return new GroupResponseDto(group?.client, group?.entity, group?.name, group?.permissions);
    }

    private static getPermissionsArray(item: DbItem): Array<string> {
        if (!item.has(DB.PERMISSIONS)) {
            return new Array<string>();
        } else {
            return item.get(DB.PERMISSIONS);
        }
    }
}
