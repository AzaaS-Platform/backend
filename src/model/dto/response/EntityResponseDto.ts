export abstract class EntityResponseDto {
    client: string;
    entity: string;

    protected constructor(client: string, entity: string) {
        this.client = client;
        this.entity = entity;
    }
}
