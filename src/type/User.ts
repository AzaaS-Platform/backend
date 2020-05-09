import { Group } from './Group';
import { DbItem } from '../database/DbItem';
import { DbMappingConstants as DB } from '../database/DbMappingConstants';
import { DynamoDB } from 'aws-sdk';

export class User {
    client: string;
    entity: string;
    groupStrings: Array<string>;
    groups: Array<Group> | null;

    constructor(client: string, entity: string, groupStrings: Array<string>, groups: Array<Group> | null = null) {
        this.client = client;
        this.entity = entity;
        this.groupStrings = groupStrings;
        this.groups = groups;
    }

    public toDbItem(): DbItem {
        const mapping: { [key: string]: any } = {};
        mapping[DB.CLIENT] = this.client;
        mapping[DB.ENTITY] = this.entity;
        mapping[DB.PERMISSIONS] = this.groups;
        return new DbItem(mapping);
    }

    static fromDbItem(item: DbItem): User {
        return new User(item.get(DB.CLIENT), item.get(DB.ENTITY), User.getGroupsArray(item));
    }

    public populateGroups(groups: Array<Group>): void {
        this.groups = groups;
    }

    private static getGroupsArray(item: DbItem): Array<string> {
        if (!item.has(DB.GROUPS)) {
            return new Array<string>();
        } else {
            return (item.get(DB.GROUPS) as DynamoDB.DocumentClient.StringSet).values;
        }
    }
}
