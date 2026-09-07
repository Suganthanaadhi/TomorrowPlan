import type { Task, TaskStatus } from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function registerUser(data: {
  username: string;
  email: string;
  password: string;
  timezone: string;
}) {
  return request<{ ok: true }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function requestPasswordReset(email: string) {
  return request<{ ok: true }>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(data: {
  token: string;
  password: string;
  confirmPassword: string;
}) {
  return request<{ ok: true }>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function fetchTasksForDate(date: string) {
  return request<Task[]>(`/api/tasks?date=${encodeURIComponent(date)}`);
}

export function fetchAllTasks() {
  return request<Task[]>("/api/tasks");
}

export function fetchOverdueTasks() {
  return request<Task[]>("/api/tasks/overdue");
}

export function createTask(data: {
  text: string;
  date: string;
  notify?: boolean;
}) {
  return request<Task>("/api/tasks", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateTask(
  id: string,
  data: Partial<{ text: string; date: string; status: TaskStatus; notify: boolean }>,
) {
  return request<Task>(`/api/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteTask(id: string) {
  return request<void>(`/api/tasks/${id}`, { method: "DELETE" });
}

export function subscribePush(subscription: PushSubscriptionJSON) {
  return request<{ ok: true }>("/api/push/subscribe", {
    method: "POST",
    body: JSON.stringify(subscription),
  });
}

export function unsubscribePush(endpoint: string) {
  return request<{ ok: true }>("/api/push/subscribe", {
    method: "DELETE",
    body: JSON.stringify({ endpoint }),
  });
}

export function deleteAccount() {
  return request<{ ok: true }>("/api/account", { method: "DELETE" });
}

export function updateProfile(data: { timezone?: string }) {
  return request<{ ok: true }>("/api/account", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
