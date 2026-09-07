import type { Task, TaskStatus } from "./types";

// TEMPORARY: in-memory task store standing in for the database. Survives Fast
// Refresh via globalThis (same trick as the eventual Prisma client singleton),
// but resets whenever the dev server restarts. Replace with Prisma once the
// backend is wired up — the route handlers that call these are the only thing
// that will need to change.
type StoredTask = Task & { userId: string };

const globalForStore = globalThis as unknown as { __mockTasks?: StoredTask[] };

function getStore(): StoredTask[] {
  if (!globalForStore.__mockTasks) {
    globalForStore.__mockTasks = [];
  }
  return globalForStore.__mockTasks;
}

function toPublicTask({ userId: _userId, ...task }: StoredTask): Task {
  return task;
}

export function listTasksByDate(userId: string, date: string): Task[] {
  return getStore()
    .filter((t) => t.userId === userId && t.date === date)
    .map(toPublicTask);
}

export function listAllTasks(userId: string): Task[] {
  return getStore()
    .filter((t) => t.userId === userId)
    .map(toPublicTask);
}

export function listOverdueTasks(userId: string, todayISO: string): Task[] {
  return getStore()
    .filter((t) => t.userId === userId && t.date < todayISO && t.status !== "COMPLETED")
    .map(toPublicTask);
}

export function createTask(
  userId: string,
  data: { text: string; date: string; notify?: boolean },
): Task {
  const now = new Date().toISOString();
  const task: StoredTask = {
    id: crypto.randomUUID(),
    userId,
    text: data.text,
    date: data.date,
    status: "PENDING",
    notify: data.notify ?? false,
    createdAt: now,
    updatedAt: now,
  };
  getStore().push(task);
  return toPublicTask(task);
}

export function updateTask(
  userId: string,
  id: string,
  data: Partial<{ text: string; date: string; status: TaskStatus; notify: boolean }>,
): Task | null {
  const task = getStore().find((t) => t.id === id && t.userId === userId);
  if (!task) return null;
  Object.assign(task, data, { updatedAt: new Date().toISOString() });
  return toPublicTask(task);
}

export function deleteTask(userId: string, id: string): boolean {
  const store = getStore();
  const index = store.findIndex((t) => t.id === id && t.userId === userId);
  if (index === -1) return false;
  store.splice(index, 1);
  return true;
}

export function deleteAllTasksForUser(userId: string): void {
  const store = getStore();
  for (let i = store.length - 1; i >= 0; i--) {
    if (store[i].userId === userId) store.splice(i, 1);
  }
}
