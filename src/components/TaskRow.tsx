"use client";

import { useRef, useState } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import { OverlayPanel } from "primereact/overlaypanel";
import { Calendar } from "primereact/calendar";
import type { Task, TaskStatus } from "@/lib/types";
import { toISODate } from "@/lib/date";
import styles from "./TaskRow.module.css";

const STATUS_SEQUENCE: TaskStatus[] = ["PENDING", "IN_PROGRESS", "COMPLETED"];
const STATUS_LABEL: Record<TaskStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
};
const STATUS_SEVERITY: Record<TaskStatus, "warning" | "info" | "success"> = {
  PENDING: "warning",
  IN_PROGRESS: "info",
  COMPLETED: "success",
};

type TaskRowProps = {
  task: Task;
  readOnly?: boolean;
  editable?: boolean;
  onCycleStatus?: (next: TaskStatus) => void;
  onComplete?: () => void;
  onDelete?: () => void;
  onSaveEdit?: (text: string) => void;
  onMove?: (date: string) => void;
  onToggleNotify?: () => void;
};

export function TaskRow({
  task,
  readOnly,
  editable,
  onCycleStatus,
  onComplete,
  onDelete,
  onSaveEdit,
  onMove,
  onToggleNotify,
}: TaskRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(task.text);
  const movePanelRef = useRef<OverlayPanel>(null);

  const cycleStatus = () => {
    if (!onCycleStatus) return;
    const currentIndex = STATUS_SEQUENCE.indexOf(task.status);
    const next = STATUS_SEQUENCE[(currentIndex + 1) % STATUS_SEQUENCE.length];
    onCycleStatus(next);
  };

  if (isEditing) {
    return (
      <li className={styles.row}>
        <InputText
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className={styles.editInput}
          autoFocus
        />
        <Button
          icon="pi pi-check"
          severity="success"
          text
          onClick={() => {
            if (draft.trim()) {
              onSaveEdit?.(draft.trim());
              setIsEditing(false);
            }
          }}
        />
        <Button
          icon="pi pi-times"
          severity="secondary"
          text
          onClick={() => {
            setDraft(task.text);
            setIsEditing(false);
          }}
        />
      </li>
    );
  }

  return (
    <li className={styles.row}>
      <Tag
        value={STATUS_LABEL[task.status]}
        severity={STATUS_SEVERITY[task.status]}
        className={onCycleStatus ? styles.clickableTag : undefined}
        onClick={onCycleStatus ? cycleStatus : undefined}
      />
      <span className={task.status === "COMPLETED" ? styles.done : styles.text}>
        {task.text}
      </span>
      {!readOnly && (
        <div className={styles.actions}>
          {onToggleNotify && (
            <Button
              icon="pi pi-bell"
              text
              severity={task.notify ? "info" : "secondary"}
              onClick={onToggleNotify}
              aria-label="Toggle reminder"
              tooltip={task.notify ? "Reminder on" : "Reminder off"}
            />
          )}
          {onComplete && task.status !== "COMPLETED" && (
            <Button icon="pi pi-check" text onClick={onComplete} aria-label="Complete" />
          )}
          {editable && (
            <Button
              icon="pi pi-pencil"
              text
              onClick={() => setIsEditing(true)}
              aria-label="Edit"
            />
          )}
          {onMove && task.status !== "COMPLETED" && (
            <>
              <Button
                icon="pi pi-calendar-plus"
                text
                onClick={(e) => movePanelRef.current?.toggle(e)}
                aria-label="Move to date"
                tooltip="Move to date"
              />
              <OverlayPanel ref={movePanelRef}>
                <Calendar
                  inline
                  minDate={new Date()}
                  onChange={(e) => {
                    if (e.value) {
                      onMove(toISODate(e.value as Date));
                      movePanelRef.current?.hide();
                    }
                  }}
                />
              </OverlayPanel>
            </>
          )}
          {onDelete && (
            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              onClick={onDelete}
              aria-label="Delete"
            />
          )}
        </div>
      )}
    </li>
  );
}
