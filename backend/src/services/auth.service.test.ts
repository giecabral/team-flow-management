import { runMigrations, clearTables } from '../test/helpers/db.js';
import { register, login, logout, refresh, getCurrentUser } from './auth.service.js';

beforeAll(() => {
  runMigrations();
});

afterEach(() => {
  clearTables();
});

const VALID_USER = {
  email: 'alice@example.com',
  password: 'Password123',
  firstName: 'Alice',
  lastName: 'Smith',
};

// ---------------------------------------------------------------------------
// register
// ---------------------------------------------------------------------------
describe('register', () => {
  it('creates a user and returns access and refresh tokens', async () => {
    const result = await register(VALID_USER);

    expect(result.user.email).toBe(VALID_USER.email);
    expect(result.user.firstName).toBe(VALID_USER.firstName);
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });

  it('does not expose password hash in the returned user', async () => {
    const result = await register(VALID_USER);
    expect(result.user).not.toHaveProperty('password_hash');
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('throws 409 when email is already registered', async () => {
    await register(VALID_USER);

    await expect(register(VALID_USER)).rejects.toMatchObject({
      statusCode: 409,
      code: 'EMAIL_EXISTS',
    });
  });
});

// ---------------------------------------------------------------------------
// login
// ---------------------------------------------------------------------------
describe('login', () => {
  beforeEach(async () => {
    await register(VALID_USER);
  });

  it('returns tokens on valid credentials', async () => {
    const result = await login(VALID_USER.email, VALID_USER.password);

    expect(result.user.email).toBe(VALID_USER.email);
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });

  it('throws 401 on wrong password', async () => {
    await expect(login(VALID_USER.email, 'wrongpassword')).rejects.toMatchObject({
      statusCode: 401,
      code: 'INVALID_CREDENTIALS',
    });
  });

  it('throws 401 on unknown email', async () => {
    await expect(login('nobody@example.com', 'anything')).rejects.toMatchObject({
      statusCode: 401,
      code: 'INVALID_CREDENTIALS',
    });
  });
});

// ---------------------------------------------------------------------------
// logout
// ---------------------------------------------------------------------------
describe('logout', () => {
  it('removes the specific refresh token so it cannot be reused', async () => {
    const { user, refreshToken } = await register(VALID_USER);

    logout(user.id, refreshToken);

    expect(() => refresh(refreshToken)).toThrow();
  });

  it('revokes all tokens when no specific token is provided', async () => {
    const { user, refreshToken } = await register(VALID_USER);

    logout(user.id);

    expect(() => refresh(refreshToken)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// refresh
// ---------------------------------------------------------------------------
describe('refresh', () => {
  it('returns new access and refresh tokens', async () => {
    const { refreshToken } = await register(VALID_USER);

    const rotated = refresh(refreshToken);

    expect(rotated.accessToken).toBeDefined();
    expect(rotated.refreshToken).toBeDefined();
    expect(rotated.refreshToken).not.toBe(refreshToken);
  });

  it('invalidates the old token after rotation', async () => {
    const { refreshToken } = await register(VALID_USER);

    refresh(refreshToken);

    expect(() => refresh(refreshToken)).toThrow();
  });

  it('throws 401 on an invalid token', () => {
    expect(() => refresh('totally-fake-token')).toThrow(
      expect.objectContaining({ statusCode: 401, code: 'INVALID_TOKEN' })
    );
  });
});

// ---------------------------------------------------------------------------
// getCurrentUser
// ---------------------------------------------------------------------------
describe('getCurrentUser', () => {
  it('returns the user when found', async () => {
    const { user } = await register(VALID_USER);

    const found = getCurrentUser(user.id);

    expect(found).not.toBeNull();
    expect(found!.email).toBe(VALID_USER.email);
  });

  it('returns null for an unknown id', () => {
    expect(getCurrentUser('nonexistent-id')).toBeNull();
  });
});
