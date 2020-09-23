interface ObfuscatedJWTPayload {
    clt: string;
    usr: string;
    prm: string;
    exp: string;
}

export class JWTPayload {
    client: string;
    user: string;
    permissions: Array<string>;
    exp: Date;

    constructor(client: string, user: string, permissions: Array<string>, exp: Date) {
        this.client = client;
        this.user = user;
        this.permissions = permissions;
        this.exp = exp;
    }

    public toString(): string {
        return JSON.stringify({
            clt: this.client,
            usr: this.user,
            prm: this.obfuscatePermissions(this.permissions),
            exp: this.exp,
        });
    }

    public fromString(payload: string): JWTPayload {
        const payloadAsJson: ObfuscatedJWTPayload = JSON.parse(payload);
        return new JWTPayload(
            payloadAsJson.clt,
            payloadAsJson.usr,
            this.deobfuscatePermissions(payloadAsJson.prm),
            new Date(payloadAsJson.exp),
        );
    }

    private obfuscatePermissions(permissions: Array<string>): string {
        return permissions.reduce((previousValue, currentValue) => previousValue + '|' + currentValue, '');
    }

    private deobfuscatePermissions(obfuscatedPermissions: string): Array<string> {
        return obfuscatedPermissions.split('|');
    }
}
