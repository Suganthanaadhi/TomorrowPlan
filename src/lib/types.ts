export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";

export type Task = {
  id: string;
  text: string;
  date: string; // "YYYY-MM-DD"
  status: TaskStatus;
  notify: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SessionUser = {
  id: string;
  username: string;
  email: string;
  timezone: string;
};
