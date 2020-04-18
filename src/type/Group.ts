export class Group {
    constructor(id: String, permissions: Array<String>) {
        this.id = id;
        this.permissions = permissions;
    }

    id: String;
    permissions: Array<String>;
}