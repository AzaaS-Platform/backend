import { EntityResponse } from './EntityResponse';

export class UserResponse extends EntityResponse {
    username: string;
    groups: Array<string>;

    constructor(client: string, entity: string, username: string, groups: Array<string>) {
        super(client, entity);
        this.username = username;
        this.groups = groups;
    }
}
