export class UserRequestDto {
    username: string | null = null;
    password: string | null = null;
    groups: Array<string> | null = null;
}
