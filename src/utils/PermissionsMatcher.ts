import { User } from '../model/User';

class Permission {
    segments: Array<string>;
    group: string;
    negative: boolean;

    constructor(permission: string, group: string) {
        if (permission[0] === '-') {
            permission = permission.substr(1);
            this.negative = true;
        } else {
            this.negative = false;
        }

        this.group = group;
        this.segments = permission.split('/');
    }

    public toString(): string {
        return this.segments.join('/');
    }

    public findAllIndices(search: string): Array<number> {
        const numbers = new Array<number>();
        this.segments.forEach((it, num) => {
            if (it === search) numbers.push(num);
        });
        return numbers;
    }

    public removeSegments(segments: Array<number>): Permission {
        const permission = this.copy();
        segments.forEach(it => permission.segments.splice(it));
        return permission;
    }

    private copy(): Permission {
        return new Permission((this.negative ? '-' : '') + this.toString(), this.group);
    }
}

export class PermissionsMatcher {
    /**
     * Builder style creator for PermissionsMatcher might be an overkill for now,
     * but will surely come in handy with inevitable extensions of this class
     * @param user
     */
    private positivePermissions: Array<string>;

    private negativePermissions: Array<string>;

    public static forUser(user: User): PermissionsMatcher {
        return new PermissionsMatcher(user);
    }

    /**
     * Match required permissions against user's permissions
     * @param permissionsRequired
     */
    public match(permissionsRequired: Array<string>): boolean {
        return (
            permissionsRequired.every(required =>
                this.positivePermissions.some(it => PermissionsMatcher.containsString(it, required)),
            ) &&
            !permissionsRequired.some(required =>
                this.negativePermissions.some(it => PermissionsMatcher.containsString(it, required)),
            )
        );
    }

    private constructor(user: User) {
        const permissions = this.extractPermissions(user);
        this.positivePermissions = PermissionsMatcher.extractPositive(permissions).map(it => it.toString());
        this.negativePermissions = PermissionsMatcher.extractNegative(permissions).map(it => it.toString());
    }

    private static extractNegative(permissions: Array<Permission>): Array<Permission> {
        return permissions
            .filter(it => it.negative)
            .filter(permission => {
                return !permissions
                    .filter(it => !it.negative)
                    .filter(it => it.group !== permission.group)
                    .some(it => PermissionsMatcher.contains(it, permission));
            });
    }

    private static extractPositive(permissions: Array<Permission>): Array<Permission> {
        return permissions.filter(it => !it.negative);
    }

    private extractPermissions(user: User): Array<Permission> {
        return user.groupObjects
            .map(it => {
                const group = it.entity;
                return it.permissions.map(it => {
                    return new Permission(it, group);
                });
            })
            .flatMap(it => it);
    }

    private static containsString(container: string, containee: string): boolean {
        return PermissionsMatcher.contains(new Permission(container, ''), new Permission(containee, ''));
    }

    private static contains(container: Permission, containee: Permission): boolean {
        if (container.segments.length > containee.segments.length) return false;

        const asterisks = Array.from(new Set(container.findAllIndices('*').concat(containee.findAllIndices('*'))));
        container = container.removeSegments(asterisks);
        containee = containee.removeSegments(asterisks);

        return container.segments.every((it, num) => it === containee.segments[num]);
    }
}
