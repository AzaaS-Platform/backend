import {Group} from "./Group";

export class User {
    constructor(id: String, groups: Array<Group>) {
        this.id = id;
        this.groups = groups;
    }

    id: String;
    groups: Array<Group>;
}