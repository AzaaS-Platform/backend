import { DbItem } from '../database/DbItem';
import { DbMappingConstants as DB } from '../database/DbMappingConstants';
import { DynamoDB } from 'aws-sdk';

export class Group {
    client: string;
    entity: string;
    permissions: Array<string>;

    constructor(client: string, entity: string, permissions: Array<string>) {
        this.client = client;
        this.entity = entity;
        this.permissions = permissions;
    }

    public static fromObject(group: Group): Group {
        return new Group(group.client, group.entity, group.permissions);
    }

    public toDbItem(): DbItem {
        const mapping: { [key: string]: any } = {};
        mapping[DB.CLIENT] = this.client;
        mapping[DB.ENTITY] = this.entity;
        mapping[DB.PERMISSIONS] = {
            type: 'String',
            values: this.permissions,
            wrapperName: 'Set',
        } as DynamoDB.DocumentClient.StringSet;
        return new DbItem(mapping);
    }

    static fromDbItem(item: DbItem): Group {
        return new Group(item.get(DB.CLIENT), item.get(DB.ENTITY), Group.getPermissionsArray(item));
    }

    private static getPermissionsArray(item: DbItem): Array<string> {
        if (!item.has(DB.PERMISSIONS)) {
            return new Array<string>();
        } else {
            return (item.get(DB.PERMISSIONS) as DynamoDB.DocumentClient.StringSet).values;
        }
    }
}
