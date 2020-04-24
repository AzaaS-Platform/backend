import { Group } from './Group';

export class User {
    constructor(id: string, groups: Array<Group>) {
        this.id = id;
        this.groups = groups;
    }

    id: string;
    groups: Array<Group>;
}
