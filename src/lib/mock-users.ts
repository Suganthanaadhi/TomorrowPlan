// TEMPORARY: in-memory user store standing in for the database, same
// globalThis-survives-Fast-Refresh trick as mock-store.ts. Passwords are kept
// in plain text here ONLY because this is a throwaway mock — the real
// backend must hash with bcryptjs and never do this. Replace with Prisma
// once that's ready; `auth.ts` and the auth API routes are the only callers.
export type MockUser = {
  id: string;
  username: string;
  email: string;
  password: string;
  timezone: string;
};

type ResetToken = { token: string; userId: string; expiresAt: number };

const globalForUsers = globalThis as unknown as {
  __mockUsers?: MockUser[];
  __mockResetTokens?: ResetToken[];
};

function getUsers(): MockUser[] {
  if (!globalForUsers.__mockUsers) {
    globalForUsers.__mockUsers = [
      {
        id: "demo-user",
        username: "demo",
        email: "demo@example.com",
        password: "demo1234",
        timezone: "UTC",
      },
    ];
  }
  return globalForUsers.__mockUsers;
}

function getResetTokens(): ResetToken[] {
  if (!globalForUsers.__mockResetTokens) {
    globalForUsers.__mockResetTokens = [];
  }
  return globalForUsers.__mockResetTokens;
}

export function findUserByCredentials(username: string, password: string): MockUser | null {
  return getUsers().find((u) => u.username === username && u.password === password) ?? null;
}

export function findUserByUsername(username: string): MockUser | null {
  return getUsers().find((u) => u.username === username) ?? null;
}

export function findUserByEmail(email: string): MockUser | null {
  return getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export function createUser(data: {
  username: string;
  email: string;
  password: string;
  timezone: string;
}): MockUser {
  const user: MockUser = { id: crypto.randomUUID(), ...data };
  getUsers().push(user);
  return user;
}

export function createResetToken(userId: string): string {
  const token = crypto.randomUUID();
  getResetTokens().push({ token, userId, expiresAt: Date.now() + 60 * 60 * 1000 });
  return token;
}

export function consumeResetToken(token: string): MockUser | null {
  const tokens = getResetTokens();
  const index = tokens.findIndex((t) => t.token === token && t.expiresAt > Date.now());
  if (index === -1) return null;
  const { userId } = tokens[index];
  tokens.splice(index, 1);
  return getUsers().find((u) => u.id === userId) ?? null;
}

export function updatePassword(userId: string, password: string): void {
  const user = getUsers().find((u) => u.id === userId);
  if (user) user.password = password;
}

export function updateTimezone(userId: string, timezone: string): void {
  const user = getUsers().find((u) => u.id === userId);
  if (user) user.timezone = timezone;
}

export function deleteUser(userId: string): void {
  const users = getUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index !== -1) users.splice(index, 1);
}
