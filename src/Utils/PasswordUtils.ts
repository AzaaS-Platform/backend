import { compare, compareSync, genSalt, genSaltSync, hash, hashSync } from 'bcrypt';

export class PasswordUtils {
    private static ROUNDS = 10;

    public static hash(password: string | null): string {
        const salt = genSaltSync(this.ROUNDS);
        return hashSync(password, salt);
    }

    public static validate(password: string | null, passwordHash: string): boolean {
        return compareSync(password, passwordHash);
    }

    public static async hashAsync(password: string | null): Promise<string> {
        return genSalt(this.ROUNDS).then(
            salt => hash(password, salt),
            err => err,
        );
    }

    public static async validateAsync(password: string | null, passwordHash: string): Promise<boolean> {
        return compare(password, passwordHash);
    }
}
