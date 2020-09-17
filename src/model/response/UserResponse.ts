import { EntityResponse } from './EntityResponse';

export class UserResponse extends EntityResponse {
    groups: Array<string>;

    constructor(client: string, entity: string, groups: Array<string>) {
        super(client, entity);
        this.groups = groups;
    }
}
