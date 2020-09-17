import { EntityResponse } from './EntityResponse';

export class GroupResponse extends EntityResponse {
    permissions: Array<string>;

    constructor(client: string, entity: string, permissions: Array<string>) {
        super(client, entity);
        this.permissions = permissions;
    }
}
