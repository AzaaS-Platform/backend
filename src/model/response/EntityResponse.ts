export abstract class EntityResponse {
    client: string;
    entity: string;

    protected constructor(client: string, entity: string) {
        this.client = client;
        this.entity = entity;
    }
}
