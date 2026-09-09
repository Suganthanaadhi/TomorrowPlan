"use client";

import { useRef, useState } from "react";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";
import { OverlayPanel } from "primereact/overlaypanel";
import { Calendar } from "primereact/calendar";
import { TaskRow } from "@/components/TaskRow";
import { useNotify } from "@/components/ToastProvider";
import { useCreateTask, useDeleteTask, useTasksForDate, useUpdateTask } from "@/hooks/useTasks";
import { formatDisplay, toISODate, todayISO, tomorrowISO } from "@/lib/date";
import styles from "./add-task.module.css";

export default function AddTaskPage() {
  const notify = useNotify();
  const [targetDate, setTargetDate] = useState(tomorrowISO());
  const datePanelRef = useRef<OverlayPanel>(null);

  const tasksQuery = useTasksForDate(targetDate);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [draftText, setDraftText] = useState("");
  const [draftNotify, setDraftNotify] = useState(false);

  const handleError = (err: unknown) =>
    notify(err instanceof Error ? err.message : "Something went wrong", "error");

  const handleAdd = () => {
    const text = draftText.trim();
    if (!text) {
      notify("Enter what you want to get done first", "warn");
      return;
    }
    createTask.mutate(
      { text, date: targetDate, notify: draftNotify },
      {
        onSuccess: () => {
          setDraftText("");
          setDraftNotify(false);
        },
        onError: handleError,
      },
    );
  };

  const tasks = tasksQuery.data ?? [];
  const isToday = targetDate === todayISO();

  return (
    <div className={styles.page}>
      <Card title={isToday ? "Plan today" : "Plan ahead"} className={styles.card}>
        <div className={styles.dateRow}>
          <span className={styles.dateLabel}>
            Planning for <strong>{formatDisplay(targetDate)}</strong>
            {isToday && " (today)"}
          </span>
          <Button
            label="Change date"
            icon="pi pi-calendar"
            text
            onClick={(e) => datePanelRef.current?.toggle(e)}
          />
          <OverlayPanel ref={datePanelRef}>
            <Calendar
              inline
              minDate={new Date()}
              value={(() => {
                const [y, m, d] = targetDate.split("-").map(Number);
                return new Date(y, m - 1, d);
              })()}
              onChange={(e) => {
                if (e.value) {
                  setTargetDate(toISODate(e.value as Date));
                  datePanelRef.current?.hide();
                }
              }}
            />
          </OverlayPanel>
        </div>

        <div className={styles.addRow}>
          <InputText
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="What do you want to get done?"
            className={styles.addInput}
          />
          <div className={styles.notifyToggle}>
            <Checkbox
              inputId="draftNotify"
              checked={draftNotify}
              onChange={(e) => setDraftNotify(!!e.checked)}
            />
            <label htmlFor="draftNotify">Notify me</label>
          </div>
          <Button
            label="Save"
            icon="pi pi-plus"
            onClick={handleAdd}
            loading={createTask.isPending}
          />
        </div>

        {tasksQuery.isLoading ? (
          <div className={styles.spinnerWrap}>
            <ProgressSpinner style={{ width: "2.5rem", height: "2.5rem" }} />
          </div>
        ) : tasks.length === 0 ? (
          <div className={styles.empty}>
            <span className="pi pi-calendar-plus" />
            <span>Nothing planned for {formatDisplay(targetDate)} yet — add your first task above.</span>
          </div>
        ) : (
          <ul className={styles.list}>
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                editable
                onSaveEdit={(text) =>
                  updateTask.mutate({ id: task.id, text }, { onError: handleError })
                }
                onDelete={() =>
                  deleteTask.mutate(task.id, {
                    onSuccess: () => notify("Task removed"),
                    onError: handleError,
                  })
                }
                onToggleNotify={() =>
                  updateTask.mutate(
                    { id: task.id, notify: !task.notify },
                    { onError: handleError },
                  )
                }
                onMove={(date) =>
                  updateTask.mutate(
                    { id: task.id, date },
                    {
                      onSuccess: () => notify(`Moved to ${formatDisplay(date)}`),
                      onError: handleError,
                    },
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
