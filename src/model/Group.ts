import { DbItem } from '../database/DbItem';
import { DbMappingConstants as DB } from '../database/DbMappingConstants';
import { Entity } from './Entity';

export class Group extends Entity {
    name: string;
    permissions: Array<string>;

    constructor(client: string, entity: string, name: string, permissions: Array<string>) {
        super(client, entity);
        this.permissions = permissions;
        this.name = name;
    }

    public toDbItem(): DbItem {
        const mapping: { [key: string]: any } = {};
        mapping[DB.CLIENT] = this.client + DB.GROUP_TYPE_SUFFIX;
        mapping[DB.ENTITY] = this.entity;
        mapping[DB.GROUP_NAME] = this.name;
        if (this.permissions.length > 0) {
            mapping[DB.PERMISSIONS] = this.permissions;
        }
        return new DbItem(mapping);
    }
}
