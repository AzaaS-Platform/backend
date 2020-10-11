import { EntityResponseDto } from './EntityResponseDto';

export class GroupResponseDto extends EntityResponseDto {
    name: string;
    permissions: Array<string>;

    constructor(client: string, entity: string, name: string, permissions: Array<string>) {
        super(client, entity);
        this.name = name;
        this.permissions = permissions;
    }
}
