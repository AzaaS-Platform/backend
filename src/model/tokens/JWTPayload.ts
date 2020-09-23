export interface ObfuscatedJWTPayload {
    clt: string;
    usr: string;
    prm: string;
}

export class JWTPayload {
    clt: string;
    usr: string;
    prm: Array<string>;

    constructor(client: string, user: string, permissions: Array<string>) {
        this.clt = client;
        this.usr = user;
        this.prm = permissions;
    }
}
