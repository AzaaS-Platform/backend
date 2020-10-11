export class PermissionsMatcher {
    public static match(permissionsRequired: Array<string>, userPermissions: Array<string>): boolean {
        return permissionsRequired.every(permission => userPermissions.includes(permission));
    }
}
