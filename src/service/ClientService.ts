import { EntityService } from './EntityService';
import { DbMappingConstants as DB, DbMappingConstants } from '../database/DbMappingConstants';
import { Entity } from '../model/Entity';
import { ClientFactory } from '../model/factory/ClientFactory';
import { DatabaseAccessor } from '../database/DatabaseAccessor';

export class ClientService extends EntityService {
    constructor(databaseAccessor: DatabaseAccessor) {
        super(databaseAccessor);
    }

    async getByKey(client: string, key: string = client): Promise<Entity | null> {
        const item = await this.databaseAccessor.getItemByKeys(client, key, DbMappingConstants.USER_TYPE);

        if (item != null) {
            const clientEntity = ClientFactory.fromDbItem(item);
            return clientEntity;
        } else {
            return null;
        }
    }

    async getAll(_client: string): Promise<Array<Entity>> {
        throw new Error('Operation not supported for clients.');
    }

    async add(entity: Entity): Promise<Entity> {
        await super.add(entity);
        return entity;
    }

    async modify(entity: Entity): Promise<void> {
        return super.modify(entity);
    }

    async delete(client: string): Promise<void> {
        return super.deleteImpl(client, client, DB.CLIENT_TYPE_SUFFIX);
    }
}
