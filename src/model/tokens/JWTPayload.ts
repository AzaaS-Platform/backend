export interface ObfuscatedJWTPayload {
    clt: string;
    usr: string;
    prm: string;
}

export class JWTPayload {
    clt: string;
    usr: string;

    constructor(client: string, user: string) {
        this.clt = client;
        this.usr = user;
    }
}
