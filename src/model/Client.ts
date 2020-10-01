import { Entity } from './Entity';
import { DbItem } from '../database/DbItem';
import { DbMappingConstants as DB } from '../database/DbMappingConstants';

/**
 * Clients are specific objects that are unique per client and have same partition key as sort key. client == entity.
 */
export class Client extends Entity {
    name: string;
    adminUsers: Array<string>;

    constructor(clientId: string, name: string, adminUsers: Array<string>) {
        super(clientId, clientId);
        this.name = name;
        this.adminUsers = adminUsers;
    }

    toDbItem(): DbItem {
        const mapping: { [key: string]: any } = {};
        // the opposite - snipping the type suffix happens in Entity's constructor
        mapping[DB.CLIENT] = this.client + DB.CLIENT_TYPE_SUFFIX;
        mapping[DB.ENTITY] = this.entity;
        mapping[DB.CLIENT_NAME] = this.name;
        if (this.adminUsers.length > 0) {
            mapping[DB.ADMIN_USERS] = this.adminUsers;
        }
        return new DbItem(mapping);
    }
}
