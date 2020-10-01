export class ClientResponseDto {
    client: string;
    name: string;
    adminUsers: Array<string>;

    constructor(client: string, name: string, adminUsers: Array<string>) {
        this.client = client;
        this.name = name;
        this.adminUsers = adminUsers;
    }
}
