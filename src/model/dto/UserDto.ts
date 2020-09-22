export class UserDto {
    username: string | null = null;
    password: string | null = null;
    groups: Array<string> | null = null;
    isAdmin: boolean | null = null;
}
