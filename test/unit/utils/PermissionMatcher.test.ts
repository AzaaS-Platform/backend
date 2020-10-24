import { User } from '../../../src/model/User';
import { Group } from '../../../src/model/Group';
import { PermissionsMatcher } from '../../../src/utils/PermissionsMatcher';

function createUserWithGroups(groups: Array<Group>): User {
    return new User('', '', '', '', [], false, groups);
}

function createRole(entity: string, permissions: Array<string>): Group {
    return new Group('', entity, '', permissions);
}

test('match exact permission', async () => {
    // given
    const user = createUserWithGroups([createRole('e1', ['p1'])]);
    const matcher = PermissionsMatcher.forUser(user);

    // when
    const result = matcher.match(['p1']);

    // then
    expect(result).toEqual(true);
});

test('exact match two out of three permissions', async () => {
    // given
    const user = createUserWithGroups([createRole('e1', ['p1', 'p2', 'p3'])]);
    const matcher = PermissionsMatcher.forUser(user);

    // when
    const result = matcher.match(['p1', 'p3']);

    // then
    expect(result).toEqual(true);
});

test('exact match permissions from different groups', async () => {
    // given
    const user = createUserWithGroups([createRole('e1', ['p1']), createRole('e2', ['p2', 'p3'])]);
    const matcher = PermissionsMatcher.forUser(user);

    // when
    const result = matcher.match(['p1', 'p3']);

    // then
    expect(result).toEqual(true);
});

test('do not match different permissions', async () => {
    // given
    const user = createUserWithGroups([createRole('e1', ['p1'])]);
    const matcher = PermissionsMatcher.forUser(user);

    // when
    const result = matcher.match(['r1']);

    // then
    expect(result).toEqual(false);
});

test('do not match if not all permissions match', async () => {
    // given
    const user = createUserWithGroups([createRole('e1', ['p1', 'p2'])]);
    const matcher = PermissionsMatcher.forUser(user);

    // when
    const result = matcher.match(['p1', 'r2']);

    // then
    expect(result).toEqual(false);
});

test('do not match if not all permissions from different roles match', async () => {
    // given
    const user = createUserWithGroups([createRole('e1', ['p1']), createRole('e2', ['p2'])]);
    const matcher = PermissionsMatcher.forUser(user);

    // when
    const result = matcher.match(['p1', 'r2']);

    // then
    expect(result).toEqual(false);
});

test('simple match permissions', async () => {
    // given
    const user = createUserWithGroups([createRole('e1', ['p1'])]);
    const matcher = PermissionsMatcher.forUser(user);

    // when
    const result = matcher.match(['p1/p2/p3']);

    // then
    expect(result).toEqual(true);
});

test('two section match permissions', async () => {
    // given
    const user = createUserWithGroups([createRole('e1', ['p1/p2'])]);
    const matcher = PermissionsMatcher.forUser(user);

    // when
    const result = matcher.match(['p1/p2/p3']);

    // then
    expect(result).toEqual(true);
});

test('two section match with redundant permission', async () => {
    // given
    const user = createUserWithGroups([createRole('e1', ['p1/p2', 'p1/p2/p3/p4'])]);
    const matcher = PermissionsMatcher.forUser(user);

    // when
    const result = matcher.match(['p1/p2/p3']);

    // then
    expect(result).toEqual(true);
});

test('two section match with redundant permission different role', async () => {
    // given
    const user = createUserWithGroups([createRole('e1', ['p1/p2']), createRole('e2', ['p1/p2/p3/p4'])]);
    const matcher = PermissionsMatcher.forUser(user);

    // when
    const result = matcher.match(['p1/p2/p3']);

    // then
    expect(result).toEqual(true);
});

test('multiple permission match with redundant permission multiple roles', async () => {
    // given
    const user = createUserWithGroups([
        createRole('e1', ['p1/p2', 'p1/r2']),
        createRole('e1', ['p1/p2/p3/p4', 'r1/r2']),
    ]);
    const matcher = PermissionsMatcher.forUser(user);

    // when
    const result = matcher.match(['p1/p2/p3', 'p1/r2/r3']);

    // then
    expect(result).toEqual(true);
});

test('do not match less specific permission', async () => {
    // given
    const user = createUserWithGroups([createRole('e1', ['p1/p2'])]);
    const matcher = PermissionsMatcher.forUser(user);

    // when
    const result = matcher.match(['p1']);

    // then
    expect(result).toEqual(false);
});

test('do not match with one less specific permission', async () => {
    // given
    const user = createUserWithGroups([createRole('e1', ['p1/p2'])]);
    const matcher = PermissionsMatcher.forUser(user);

    // when
    const result = matcher.match(['p1', 'p1/p2/p3']);

    // then
    expect(result).toEqual(false);
});

test('match with non applicable negative permission', async () => {
    // given
    const user = createUserWithGroups([createRole('e1', ['p1/p2', '-r1'])]);
    const matcher = PermissionsMatcher.forUser(user);

    // when
    const result = matcher.match(['p1/p2/p3']);

    // then
    expect(result).toEqual(true);
});

test('match with non applicable negative permission 2', async () => {
    // given
    const user = createUserWithGroups([createRole('e1', ['p1/p2', 'p1/p2/r3'])]);
    const matcher = PermissionsMatcher.forUser(user);

    // when
    const result = matcher.match(['p1/p2/p3']);

    // then
    expect(result).toEqual(true);
});

test('match with non applicable negative permission 3', async () => {
    // given
    const user = createUserWithGroups([createRole('e1', ['p1/p2', 'p1/p2/p3/p4'])]);
    const matcher = PermissionsMatcher.forUser(user);

    // when
    const result = matcher.match(['p1/p2/p3']);

    // then
    expect(result).toEqual(true);
});

test('match with non enforcible negative permission', async () => {
    // given
    const user = createUserWithGroups([createRole('e1', ['p1/p2', 'p1'])]);
    const matcher = PermissionsMatcher.forUser(user);

    // when
    const result = matcher.match(['p1/p2/p3']);

    // then
    expect(result).toEqual(true);
});

test('do not match with only negative permission', async () => {
    // given
    const user = createUserWithGroups([createRole('e1', ['-p1/p2'])]);
    const matcher = PermissionsMatcher.forUser(user);

    // when
    const result = matcher.match(['p1/p2/p3']);

    // then
    expect(result).toEqual(false);
});

test('do not match with negative role including positive', async () => {
    // given
    const user = createUserWithGroups([createRole('e1', ['p1/p2', '-p1'])]);
    const matcher = PermissionsMatcher.forUser(user);

    // when
    const result = matcher.match(['p1/p2/p3']);

    // then
    expect(result).toEqual(false);
});

test('do not match with exact applicable negative permission', async () => {
    // given
    const user = createUserWithGroups([createRole('e1', ['p1/p2', '-p1/p2/p3'])]);
    const matcher = PermissionsMatcher.forUser(user);

    // when
    const result = matcher.match(['p1/p2/p3']);

    // then
    expect(result).toEqual(false);
});

test('do not match with applicable negative permission', async () => {
    // given
    const user = createUserWithGroups([createRole('e1', ['p1', '-p1/p2'])]);
    const matcher = PermissionsMatcher.forUser(user);

    // when
    const result = matcher.match(['p1/p2/p3']);

    // then
    expect(result).toEqual(false);
});

test('match when negative role comes from other group', async () => {
    // given
    const user = createUserWithGroups([createRole('e1', ['p1/p2']), createRole('e2', ['-p1/p2/p3'])]);
    const matcher = PermissionsMatcher.forUser(user);

    // when
    const result = matcher.match(['p1/p2/p3']);

    // then
    expect(result).toEqual(true);
});

test('match when negative role comes from other group 2', async () => {
    // given
    const user = createUserWithGroups([createRole('e1', ['p1/p2']), createRole('e2', ['p1/p2', '-p1/p2/p3'])]);
    const matcher = PermissionsMatcher.forUser(user);

    // when
    const result = matcher.match(['p1/p2/p3']);

    // then
    expect(result).toEqual(true);
});

test('match when asterisk permission is at the end', async () => {
    // given
    const user = createUserWithGroups([createRole('e1', ['p1/p2/*'])]);
    const matcher = PermissionsMatcher.forUser(user);

    // when
    const result = matcher.match(['p1/p2/p3']);

    // then
    expect(result).toEqual(true);
});

test('match when asterisk permission is at the end', async () => {
    // given
    const user = createUserWithGroups([createRole('e1', ['p1/p2/*'])]);
    const matcher = PermissionsMatcher.forUser(user);

    // when
    const result = matcher.match(['p1/p2/p3']);

    // then
    expect(result).toEqual(true);
});

test('match when asterisk permission is at the beginning', async () => {
    // given
    const user = createUserWithGroups([createRole('e1', ['*/p2/p3'])]);
    const matcher = PermissionsMatcher.forUser(user);

    // when
    const result = matcher.match(['p1/p2/p3']);

    // then
    expect(result).toEqual(true);
});

test('match when there are multiple asterisks', async () => {
    // given
    const user = createUserWithGroups([createRole('e1', ['*/p2/*'])]);
    const matcher = PermissionsMatcher.forUser(user);

    // when
    const result = matcher.match(['p1/p2/p3']);

    // then
    expect(result).toEqual(true);
});

test('match any permissions when there is only asterisk', async () => {
    // given
    const user = createUserWithGroups([createRole('e1', ['*'])]);
    const matcher = PermissionsMatcher.forUser(user);

    // when
    const result = matcher.match(['p1/p2/p3', 'permission']);

    // then
    expect(result).toEqual(true);
});

test('match a permission with negative permission in other group with asterisk', async () => {
    // given
    const user = createUserWithGroups([createRole('e1', ['*']), createRole('e2', ['-p1/p2'])]);
    const matcher = PermissionsMatcher.forUser(user);

    // when
    const result = matcher.match(['p1/p2']);

    // then
    expect(result).toEqual(true);
});

test('match permission with asterisk', async () => {
    // given
    const user = createUserWithGroups([createRole('e1', ['p1/*/p3', '-p1/p2/p3'])]);
    const matcher = PermissionsMatcher.forUser(user);

    // when
    const result = matcher.match(['p1/r2/p3']);

    // then
    expect(result).toEqual(true);
});

test('do not match an exact permission with it is disallowed with asterisk', async () => {
    // given
    const user = createUserWithGroups([createRole('e1', ['*/p2', '-p1/p2/p3'])]);
    const matcher = PermissionsMatcher.forUser(user);

    // when
    const result = matcher.match(['p1/p2/p3']);

    // then
    expect(result).toEqual(false);
});

test('do not match an exact permission with it is disallowed with asterisk', async () => {
    // given
    const user = createUserWithGroups([createRole('e1', ['*/p2', '-p1/p2/p3'])]);
    const matcher = PermissionsMatcher.forUser(user);

    // when
    const result = matcher.match(['p1/p2/p3']);

    // then
    expect(result).toEqual(false);
});

test('do not match a permission with it is disallowed with asterisk', async () => {
    // given
    const user = createUserWithGroups([createRole('e1', ['*/p2', '-p1/p2/p3'])]);
    const matcher = PermissionsMatcher.forUser(user);

    // when
    const result = matcher.match(['p1/p2/p3/p4']);

    // then
    expect(result).toEqual(false);
});

test('do not match a permission with it is disallowed with asterisk 2', async () => {
    // given
    const user = createUserWithGroups([createRole('e1', ['*', '-p1/p2/p3'])]);
    const matcher = PermissionsMatcher.forUser(user);

    // when
    const result = matcher.match(['p1/p2/p3/p4']);

    // then
    expect(result).toEqual(false);
});

test('do not match a permission with it is disallowed with asterisk 3', async () => {
    // given
    const user = createUserWithGroups([createRole('e1', ['p1/*/p3', '-p1/p2/p3'])]);
    const matcher = PermissionsMatcher.forUser(user);

    // when
    const result = matcher.match(['p1/p2/p3']);

    // then
    expect(result).toEqual(false);
});

test('do not match a permission with it is disallowed with asterisk 4', async () => {
    // given
    const user = createUserWithGroups([createRole('e1', ['p1/*/p3', '-p1/p2/p3'])]);
    const matcher = PermissionsMatcher.forUser(user);

    // when
    const result = matcher.match(['p1/p2/p3/p4']);

    // then
    expect(result).toEqual(false);
});
