"use client";

import { useState } from "react";
import { Card } from "primereact/card";
import { Calendar } from "primereact/calendar";
import { Tag } from "primereact/tag";
import { ProgressSpinner } from "primereact/progressspinner";
import { TaskRow } from "@/components/TaskRow";
import { useTasksForDate } from "@/hooks/useTasks";
import { formatDisplay, toISODate, todayISO } from "@/lib/date";
import styles from "./history.module.css";

export default function HistoryPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const selectedISO = toISODate(selectedDate);

  const tasksQuery = useTasksForDate(selectedISO);
  const tasks = tasksQuery.data ?? [];

  const completed = tasks.filter((t) => t.status === "COMPLETED").length;
  const pending = tasks.filter((t) => t.status === "PENDING").length;

  return (
    <div className={styles.page}>
      <div>
        <h1 className={styles.heading}>History</h1>
        <p className={styles.subheading}>Pick a day to see what was planned.</p>
      </div>

      <div className={styles.layout}>
        <Card className={styles.calendarCard}>
          <Calendar
            value={selectedDate}
            onChange={(e) => e.value && setSelectedDate(e.value as Date)}
            inline
            maxDate={new Date()}
            className={styles.calendar}
          />
        </Card>

        <Card
          title={formatDisplay(selectedISO)}
          subTitle={selectedISO === todayISO() ? "Today" : undefined}
          className={styles.detailCard}
        >
          {tasksQuery.isLoading ? (
            <div className={styles.spinnerWrap}>
              <ProgressSpinner style={{ width: "2.5rem", height: "2.5rem" }} />
            </div>
          ) : tasks.length === 0 ? (
            <div className={styles.empty}>
              <span className="pi pi-calendar-times" />
              <span>Nothing was planned for this day.</span>
            </div>
          ) : (
            <>
              <div className={styles.summary}>
                <Tag value={`${completed} completed`} severity="success" />
                <Tag value={`${pending} pending`} severity="warning" />
              </div>
              <ul className={styles.list}>
                {tasks.map((task) => (
                  <TaskRow key={task.id} task={task} readOnly />
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
