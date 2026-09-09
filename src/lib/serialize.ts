import type { Task as PrismaTask } from "@prisma/client";
import type { Task } from "./types";

export function toDbDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

export function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function serializeTask(task: PrismaTask): Task {
  return {
    id: task.id,
    text: task.text,
    date: toDateString(task.date),
    status: task.status,
    notify: task.notify,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}
