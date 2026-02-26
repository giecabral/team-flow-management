import { runMigrations, clearTables } from '../test/helpers/db.js';
import {
  createUser,
  listUsers,
  getUserById,
  updateProfile,
  changePassword,
} from './users.service.js';

beforeAll(() => {
  runMigrations();
});

afterEach(() => {
  clearTables();
});

// ---------------------------------------------------------------------------
// createUser
// ---------------------------------------------------------------------------
describe('createUser', () => {
  it('creates a user and returns it with a generated password', async () => {
    const { user, password } = await createUser({
      email: 'alice@example.com',
      firstName: 'Alice',
      lastName: 'Smith',
    });

    expect(user.id).toBeDefined();
    expect(user.email).toBe('alice@example.com');
    expect(user.firstName).toBe('Alice');
    expect(user.lastName).toBe('Smith');
    expect(password).toMatch(/^[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}$/);
  });

  it('throws 409 when email is already registered', async () => {
    await createUser({ email: 'alice@example.com', firstName: 'Alice', lastName: 'Smith' });

    await expect(
      createUser({ email: 'alice@example.com', firstName: 'Other', lastName: 'User' })
    ).rejects.toMatchObject({ statusCode: 409, code: 'EMAIL_EXISTS' });
  });
});

// ---------------------------------------------------------------------------
// listUsers
// ---------------------------------------------------------------------------
describe('listUsers', () => {
  beforeEach(async () => {
    await createUser({ email: 'alice@example.com', firstName: 'Alice', lastName: 'Smith' });
    await createUser({ email: 'bob@example.com', firstName: 'Bob', lastName: 'Jones' });
  });

  it('returns all users when no search term is provided', () => {
    const users = listUsers();
    expect(users).toHaveLength(2);
  });

  it('filters by first name', () => {
    const users = listUsers('alice');
    expect(users).toHaveLength(1);
    expect(users[0].firstName).toBe('Alice');
  });

  it('filters by email', () => {
    const users = listUsers('bob@example.com');
    expect(users).toHaveLength(1);
    expect(users[0].email).toBe('bob@example.com');
  });

  it('returns empty array when nothing matches', () => {
    const users = listUsers('zzz-no-match');
    expect(users).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// getUserById
// ---------------------------------------------------------------------------
describe('getUserById', () => {
  it('returns the user when found', async () => {
    const { user } = await createUser({ email: 'alice@example.com', firstName: 'Alice', lastName: 'Smith' });
    const found = getUserById(user.id);
    expect(found).not.toBeNull();
    expect(found!.email).toBe('alice@example.com');
  });

  it('returns null for an unknown id', () => {
    expect(getUserById('nonexistent-id')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// updateProfile
// ---------------------------------------------------------------------------
describe('updateProfile', () => {
  it('updates name and email', async () => {
    const { user } = await createUser({ email: 'alice@example.com', firstName: 'Alice', lastName: 'Smith' });

    const updated = await updateProfile(user.id, {
      firstName: 'Alicia',
      lastName: 'Johnson',
      email: 'alicia@example.com',
    });

    expect(updated.firstName).toBe('Alicia');
    expect(updated.lastName).toBe('Johnson');
    expect(updated.email).toBe('alicia@example.com');
  });

  it('allows keeping the same email', async () => {
    const { user } = await createUser({ email: 'alice@example.com', firstName: 'Alice', lastName: 'Smith' });

    const updated = await updateProfile(user.id, {
      firstName: 'Alicia',
      lastName: 'Smith',
      email: 'alice@example.com',
    });

    expect(updated.email).toBe('alice@example.com');
  });

  it('throws 409 when the new email belongs to another user', async () => {
    const { user: alice } = await createUser({ email: 'alice@example.com', firstName: 'Alice', lastName: 'Smith' });
    await createUser({ email: 'bob@example.com', firstName: 'Bob', lastName: 'Jones' });

    await expect(
      updateProfile(alice.id, { firstName: 'Alice', lastName: 'Smith', email: 'bob@example.com' })
    ).rejects.toMatchObject({ statusCode: 409, code: 'EMAIL_EXISTS' });
  });
});

// ---------------------------------------------------------------------------
// changePassword
// ---------------------------------------------------------------------------
describe('changePassword', () => {
  it('changes password successfully with correct current password', async () => {
    const { user } = await createUser({ email: 'alice@example.com', firstName: 'Alice', lastName: 'Smith' });

    // createUser generates a random password — set a known one first via auth register
    // For this test, we use auth.register to have a known password
    const authService = await import('./auth.service.js');
    await authService.register({
      email: 'test@example.com',
      password: 'OldPass123',
      firstName: 'Test',
      lastName: 'User',
    });

    const allUsers = listUsers('test@example.com');
    const testUser = allUsers[0];

    await expect(
      changePassword(testUser.id, { currentPassword: 'OldPass123', newPassword: 'NewPass456' })
    ).resolves.toBeUndefined();
  });

  it('throws 400 when the current password is wrong', async () => {
    const authService = await import('./auth.service.js');
    const { user } = await authService.register({
      email: 'test@example.com',
      password: 'OldPass123',
      firstName: 'Test',
      lastName: 'User',
    });

    await expect(
      changePassword(user.id, { currentPassword: 'WrongPassword', newPassword: 'NewPass456' })
    ).rejects.toMatchObject({ statusCode: 400, code: 'INVALID_PASSWORD' });
  });
});
