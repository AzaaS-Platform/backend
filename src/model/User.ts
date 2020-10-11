import { Group } from './Group';
import { DbItem } from '../database/DbItem';
import { DbMappingConstants as DB } from '../database/DbMappingConstants';
import { Entity } from './Entity';
import { InternalServerError } from '../error/InternalServerError';

export class User extends Entity {
    username: string;
    passwordHash: string;
    groups: Array<string>;
    isAdmin: boolean;
    JWTSecret: string | null;
    MFASecret: string | null;

    // null means invalid (not initialized) state
    private _groupObjects: Array<Group> | null;
    get groupObjects(): Array<Group> {
        if (this._groupObjects !== null) {
            return this._groupObjects;
        } else {
            throw new InternalServerError('groups were not initialized');
        }
    }

    set groupObjects(groups: Array<Group>) {
        this._groupObjects = groups;
    }

    constructor(
        client: string,
        entity: string,
        username: string,
        passwordHash: string,
        groupStrings: Array<string>,
        isAdmin: boolean,
        groups: Array<Group> | null = null,
        JWTSecret: string | null = null,
        MFASecret: string | null = null,
    ) {
        super(client, entity);
        this.groups = groupStrings;
        this._groupObjects = groups;
        this.username = username;
        this.passwordHash = passwordHash;
        this.isAdmin = isAdmin;
        this.JWTSecret = JWTSecret;
        this.MFASecret = MFASecret;
    }

    public toDbItem(): DbItem {
        const mapping: { [key: string]: any } = {};
        // the opposite - snipping the type suffix happens in Entity's constructor
        mapping[DB.CLIENT] = this.client + DB.USER_TYPE_SUFFIX;
        mapping[DB.ENTITY] = this.entity;
        mapping[DB.USERNAME] = this.username;
        mapping[DB.PASSWORD_HASH] = this.passwordHash;
        mapping[DB.GROUPS] = this.getStringsFromGroups();
        mapping[DB.IS_ADMIN] = this.isAdmin;
        mapping[DB.JWT_SECRET] = this.JWTSecret;
        mapping[DB.MFA_SECRET] = this.MFASecret;
        return new DbItem(mapping);
    }

    public populateGroups(groups: Array<Group>): void {
        this.groupObjects = groups;
    }

    private getStringsFromGroups(): Array<string> | undefined {
        if (this.groupObjects.length == 0) return undefined;
        return this.groupObjects?.map(it => {
            return it.entity;
        });
    }
}
