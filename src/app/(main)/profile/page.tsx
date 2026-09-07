"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { ProgressSpinner } from "primereact/progressspinner";
import { useNotify } from "@/components/ToastProvider";
import { useAllTasks } from "@/hooks/useTasks";
import { deleteAccount, updateProfile } from "@/lib/api";
import { detectTimezone } from "@/lib/date";
import {
  disablePushReminders,
  enablePushReminders,
  getExistingSubscription,
  isPushSupported,
} from "@/lib/push";
import styles from "./profile.module.css";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const notify = useNotify();
  const router = useRouter();
  const tasksQuery = useAllTasks();

  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [timezone, setTimezone] = useState<string | null>(null);
  const [savingTimezone, setSavingTimezone] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getExistingSubscription().then((sub) => setPushEnabled(!!sub));
  }, []);

  useEffect(() => {
    if (session?.user?.timezone && timezone === null) {
      setTimezone(session.user.timezone);
    }
  }, [session, timezone]);

  const handleError = (err: unknown) =>
    notify(err instanceof Error ? err.message : "Something went wrong", "error");

  const togglePush = async () => {
    setPushBusy(true);
    try {
      if (pushEnabled) {
        await disablePushReminders();
        setPushEnabled(false);
        notify("Reminders turned off on this device");
      } else {
        if (!VAPID_PUBLIC_KEY) {
          throw new Error("Push isn't configured on the server yet");
        }
        await enablePushReminders(VAPID_PUBLIC_KEY);
        setPushEnabled(true);
        notify("Reminders enabled on this device");
      }
    } catch (err) {
      handleError(err);
    } finally {
      setPushBusy(false);
    }
  };

  const saveTimezone = async () => {
    if (!timezone) return;
    setSavingTimezone(true);
    try {
      await updateProfile({ timezone });
      await updateSession({ timezone });
      notify("Timezone updated");
    } catch (err) {
      handleError(err);
    } finally {
      setSavingTimezone(false);
    }
  };

  const confirmDelete = () => {
    confirmDialog({
      message: "This permanently deletes your account and all your tasks. This can't be undone.",
      header: "Delete account?",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Delete account",
      rejectLabel: "Cancel",
      acceptClassName: "p-button-danger",
      accept: async () => {
        setDeleting(true);
        try {
          await deleteAccount();
          await signOut({ redirect: false });
          router.push("/login");
        } catch (err) {
          handleError(err);
          setDeleting(false);
        }
      },
    });
  };

  const tasks = tasksQuery.data ?? [];
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "COMPLETED").length;
  const rate = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className={styles.page}>
      <ConfirmDialog />

      <h1 className={styles.heading}>Profile</h1>

      <Card title="Account" className={styles.card}>
        <div className={styles.row}>
          <span className={styles.label}>Username</span>
          <span>{session?.user?.username}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Email</span>
          <span>{session?.user?.email}</span>
        </div>

        <div className={styles.stats}>
          {tasksQuery.isLoading ? (
            <ProgressSpinner style={{ width: "2rem", height: "2rem" }} />
          ) : (
            <>
              <Tag value={`${total} total`} />
              <Tag value={`${completed} completed`} severity="success" />
              <Tag value={`${rate}% completion rate`} severity="info" />
            </>
          )}
        </div>

        <div className={styles.buttonRow}>
          <Button
            label="Logout"
            icon="pi pi-sign-out"
            severity="secondary"
            onClick={() => signOut({ redirect: false }).then(() => router.push("/login"))}
          />
        </div>
      </Card>

      <Card title="Reminders" className={styles.card}>
        <p className={styles.helperText}>
          {isPushSupported()
            ? "Get a push notification when it's time to work through tomorrow's plan."
            : "Push notifications aren't supported in this browser."}
        </p>
        <div className={styles.buttonRow}>
          <Button
            label={
              pushEnabled ? "Disable reminders on this device" : "Enable reminders on this device"
            }
            icon="pi pi-bell"
            onClick={togglePush}
            loading={pushBusy}
            disabled={!isPushSupported()}
          />
        </div>
      </Card>

      <Card title="Timezone" className={styles.card}>
        <p className={styles.helperText}>
          Used to figure out when &ldquo;today&rdquo; and &ldquo;tomorrow&rdquo; start for
          your reminders.
        </p>
        <div className={styles.row}>
          <span className={styles.label}>Current</span>
          <span>{timezone ?? "Loading…"}</span>
        </div>
        <div className={styles.buttonRow}>
          <Button
            label="Use browser timezone"
            icon="pi pi-refresh"
            severity="secondary"
            onClick={() => setTimezone(detectTimezone())}
          />
          <Button
            label="Save timezone"
            icon="pi pi-check"
            onClick={saveTimezone}
            loading={savingTimezone}
          />
        </div>
      </Card>

      <Card title="Danger zone" className={`${styles.card} ${styles.dangerCard}`}>
        <div className={styles.buttonRow}>
          <Button
            label="Delete account"
            icon="pi pi-trash"
            severity="danger"
            onClick={confirmDelete}
            loading={deleting}
          />
        </div>
      </Card>
    </div>
  );
}
