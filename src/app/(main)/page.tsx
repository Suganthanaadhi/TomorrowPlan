"use client";

import Link from "next/link";
import { Card } from "primereact/card";
import { ProgressSpinner } from "primereact/progressspinner";
import { TaskRow } from "@/components/TaskRow";
import { useNotify } from "@/components/ToastProvider";
import {
  useOverdueTasks,
  useTasksForDate,
  useUpdateTask,
  useDeleteTask,
} from "@/hooks/useTasks";
import { formatDisplay, todayISO } from "@/lib/date";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  const notify = useNotify();
  const today = todayISO();

  const overdueQuery = useOverdueTasks();
  const todayQuery = useTasksForDate(today);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const handleError = (err: unknown) =>
    notify(err instanceof Error ? err.message : "Something went wrong", "error");

  if (overdueQuery.isLoading || todayQuery.isLoading) {
    return (
      <div className={styles.spinnerWrap}>
        <ProgressSpinner />
      </div>
    );
  }

  const overdueTasks = overdueQuery.data ?? [];
  const todayTasks = todayQuery.data ?? [];

  return (
    <div className={styles.page}>
      <div>
        <h1 className={styles.heading}>Dashboard</h1>
        <p className={styles.subheading}>{formatDisplay(today)}</p>
      </div>

      {overdueTasks.length > 0 && (
        <Card
          title={`Overdue (${overdueTasks.length})`}
          className={`${styles.card} ${styles.overdueCard}`}
        >
          <ul className={styles.list}>
            {overdueTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onCycleStatus={(status) =>
                  updateTask.mutate({ id: task.id, status }, { onError: handleError })
                }
                onComplete={() =>
                  updateTask.mutate(
                    { id: task.id, status: "COMPLETED" },
                    { onError: handleError },
                  )
                }
                onDelete={() =>
                  deleteTask.mutate(task.id, {
                    onSuccess: () => notify("Task deleted"),
                    onError: handleError,
                  })
                }
                onMove={(date) =>
                  updateTask.mutate(
                    { id: task.id, date },
                    { onSuccess: () => notify(`Moved to ${formatDisplay(date)}`), onError: handleError },
                  )
                }
              />
            ))}
          </ul>
        </Card>
      )}

      <Card title="Today's plan" className={styles.card}>
        {todayTasks.length === 0 ? (
          <div className={styles.empty}>
            <span className="pi pi-inbox" />
            <span>
              No tasks planned for today — <Link href="/add-task">plan them now</Link>.
            </span>
          </div>
        ) : (
          <ul className={styles.list}>
            {todayTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onCycleStatus={(status) =>
                  updateTask.mutate({ id: task.id, status }, { onError: handleError })
                }
                onComplete={() =>
                  updateTask.mutate(
                    { id: task.id, status: "COMPLETED" },
                    { onError: handleError },
                  )
                }
                onDelete={() =>
                  deleteTask.mutate(task.id, {
                    onSuccess: () => notify("Task deleted"),
                    onError: handleError,
                  })
                }
                onMove={(date) =>
                  updateTask.mutate(
                    { id: task.id, date },
                    { onSuccess: () => notify(`Moved to ${formatDisplay(date)}`), onError: handleError },
                  )
                }
              />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
