export class JWTPayload {
    clt: string;
    usr: string;
    adm: boolean;

    constructor(client: string, user: string, isAdmin: boolean) {
        this.clt = client;
        this.usr = user;
        this.adm = isAdmin;
    }
}
