import { EntityResponseDto } from './EntityResponseDto';

export class GroupResponseDto extends EntityResponseDto {
    permissions: Array<string>;

    constructor(client: string, entity: string, permissions: Array<string>) {
        super(client, entity);
        this.permissions = permissions;
    }
}
