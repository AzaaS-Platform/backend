export class ClientResponseDto {
    client: string;
    adminUsers: Array<string>;

    constructor(client: string, adminUsers: Array<string>) {
        this.client = client;
        this.adminUsers = adminUsers;
    }
}
