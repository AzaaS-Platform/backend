import { EntityResponseDto } from './EntityResponseDto';

export class UserResponseDto extends EntityResponseDto {
    username: string;
    groups: Array<string>;

    constructor(client: string, entity: string, username: string, groups: Array<string>) {
        super(client, entity);
        this.username = username;
        this.groups = groups;
    }
}
