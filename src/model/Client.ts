import { Entity } from './Entity';
import { DbItem } from '../database/DbItem';
import { DbMappingConstants as DB } from '../database/DbMappingConstants';

/**
 * Clients are specific objects that are unique per client and have same partition key as sort key. client == entity.
 */
export class Client extends Entity {
    adminUsers: Array<string>;
    allowedUrls: Array<string>;

    constructor(clientId: string, entity: string, adminUsers: Array<string>, allowedUrls: Array<string>) {
        super(clientId, entity);
        this.adminUsers = adminUsers;
        this.allowedUrls = allowedUrls;
    }

    toDbItem(): DbItem {
        const mapping: { [key: string]: any } = {};
        // the opposite - snipping the type suffix happens in Entity's constructor
        mapping[DB.CLIENT] = this.client + DB.CLIENT_TYPE_SUFFIX;
        mapping[DB.ENTITY] = this.entity;
        if (this.adminUsers.length > 0) {
            mapping[DB.ADMIN_USERS] = this.adminUsers;
        }
        if (this.allowedUrls.length > 0) {
            mapping[DB.ALLOWED_URLS] = this.allowedUrls;
        }
        return new DbItem(mapping);
    }

    isUrlAllowed(url: string): boolean {
        // allow if any allowedUrl is a substring of redirectUrl
        return this.allowedUrls.some(it => url.lastIndexOf(it) > -1);
    }
}
