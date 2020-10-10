export class DbMappingConstants {
    // DDB constants

    public static CLIENT = 'client';
    public static ENTITY = 'entity';
    public static GROUPS = 'groups';
    public static PERMISSIONS = 'permissions';

    public static CLIENT_VALUE = ':client';
    public static ENTITY_VALUE = ':entity';

    public static USERNAME = 'username';
    public static PASSWORD_HASH = 'passwordHash';
    public static IS_ADMIN = 'isAdmin';
    public static JWT_SECRET = 'jwtSecret';
    public static MFA_SECRET = 'mfaSecret';

    public static ADMIN_USERS = 'adminUsers';

    // schema constants

    public static TYPE_SEPARATOR = ':';

    public static GROUP_TYPE = 'group';
    public static USER_TYPE = 'user';
    public static CLIENT_TYPE = 'tenant';

    public static GROUP_TYPE_SUFFIX = DbMappingConstants.TYPE_SEPARATOR + DbMappingConstants.GROUP_TYPE;
    public static USER_TYPE_SUFFIX = DbMappingConstants.TYPE_SEPARATOR + DbMappingConstants.USER_TYPE;
    public static CLIENT_TYPE_SUFFIX = DbMappingConstants.TYPE_SEPARATOR + DbMappingConstants.CLIENT_TYPE;

    // Magic values, to be reworked.
    public static MFA_NOT_ENABLED_MAGIC_VALUE = 'MfaNotEnabled';
}
