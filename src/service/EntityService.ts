import { BadRequest } from '../error/BadRequest';
import { InternalServerError } from '../error/InternalServerError';
import { Entity } from '../model/Entity';
import { DatabaseAccessor } from '../database/DatabaseAccessor';

export abstract class EntityService {
    protected constructor(protected databaseAccessor: DatabaseAccessor) {}

    abstract async getByKey(client: string, key: string): Promise<Entity | null>;

    abstract async getAll(client: string): Promise<Array<Entity>>;

    async add(entity: Entity): Promise<void> {
        try {
            return await this.databaseAccessor.put(entity.toDbItem(), false);
        } catch (e) {
            if (e.message === 'The conditional request failed') throw new BadRequest('cannot overwrite item');
            else throw new InternalServerError(e.message);
        }
    }

    async modify(entity: Entity): Promise<void> {
        try {
            return await this.databaseAccessor.put(entity.toDbItem(), true);
        } catch (e) {
            if (e.message === 'The conditional request failed') throw new BadRequest('item does not exist');
            else throw new InternalServerError(e.message);
        }
    }

    abstract async delete(client: string, id: string): Promise<void>;

    protected async deleteImpl(client: string, id: string, suffix: string): Promise<void> {
        try {
            return await this.databaseAccessor.delete(client, id, suffix);
        } catch (e) {
            if (e.message === 'The conditional request failed') throw new BadRequest('item does not exist');
            else throw new InternalServerError(e.message);
        }
    }
}
