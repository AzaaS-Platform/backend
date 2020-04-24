export class Group {
    constructor(id: string, permissions: Array<string>) {
        this.id = id;
        this.permissions = permissions;
    }

    id: string;
    permissions: Array<string>;
}
