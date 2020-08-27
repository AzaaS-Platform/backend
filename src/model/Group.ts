import { DbItem } from '../database/DbItem';
import { DbMappingConstants as DB } from '../database/DbMappingConstants';
import { Entity } from './Entity';

export class Group extends Entity {
    permissions: Array<string>;

    constructor(client: string, entity: string, permissions: Array<string>) {
        super(client, entity);
        this.permissions = permissions;
    }

    public toDbItem(): DbItem {
        const mapping: { [key: string]: any } = {};
        mapping[DB.CLIENT] = this.client + DB.GROUP_TYPE_SUFFIX;
        mapping[DB.ENTITY] = this.entity;
        if (this.permissions.length > 0) {
            mapping[DB.PERMISSIONS] = this.permissions;
        }
        return new DbItem(mapping);
    }

    static fromDbItem(item: DbItem): Group {
        return new Group(item.get(DB.CLIENT), item.get(DB.ENTITY), Group.getPermissionsArray(item));
    }

    public static fromObject(object: Group): Group {
        if (object.permissions === undefined) object.permissions = new Array<string>();
        return new Group(object.client, object.entity, object.permissions);
    }

    private static getPermissionsArray(item: DbItem): Array<string> {
        if (!item.has(DB.PERMISSIONS)) {
            return new Array<string>();
        } else {
            return item.get(DB.PERMISSIONS);
        }
    }
}
