import { DbItem } from '../database/DbItem';
import { DbMappingConstants } from '../database/DbMappingConstants';

export abstract class Entity {
    client: string;
    entity: string;

    protected constructor(client: string, entity: string) {
        this.client = Entity.snipTypeSuffixIfPresent(client);
        this.entity = entity;
    }

    private static snipTypeSuffixIfPresent(client: string): string {
        return client.split(DbMappingConstants.TYPE_SEPARATOR)[0];
    }

    abstract toDbItem(): DbItem;
}
