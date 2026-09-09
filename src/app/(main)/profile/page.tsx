"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import { InputSwitch } from "primereact/inputswitch";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { ProgressSpinner } from "primereact/progressspinner";
import { useNotify } from "@/components/ToastProvider";
import { useAllTasks } from "@/hooks/useTasks";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { deleteAccount } from "@/lib/api";
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
  const profileQuery = useProfile();
  const updateProfileMutation = useUpdateProfile();

  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);

  const [username, setUsername] = useState<string | null>(null);
  const [savingUsername, setSavingUsername] = useState(false);

  const [timezone, setTimezone] = useState<string | null>(null);
  const [savingTimezone, setSavingTimezone] = useState(false);

  const [planEnabled, setPlanEnabled] = useState(true);
  const [planTime, setPlanTime] = useState("07:30");
  const [savingPlan, setSavingPlan] = useState(false);

  const [eodEnabled, setEodEnabled] = useState(true);
  const [eodTime, setEodTime] = useState("20:00");
  const [savingEod, setSavingEod] = useState(false);

  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getExistingSubscription().then((sub) => setPushEnabled(!!sub));
  }, []);

  useEffect(() => {
    if (!profileQuery.data) return;
    if (username === null) setUsername(profileQuery.data.username);
    if (timezone === null) setTimezone(profileQuery.data.timezone);
    setPlanEnabled(profileQuery.data.planReminderEnabled);
    setPlanTime(profileQuery.data.planReminderTime);
    setEodEnabled(profileQuery.data.endOfDayReminderEnabled);
    setEodTime(profileQuery.data.endOfDayReminderTime);
  }, [profileQuery.data, username, timezone]);

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

  const saveUsername = async () => {
    if (!username || !username.trim()) return;
    setSavingUsername(true);
    try {
      await updateProfileMutation.mutateAsync({ username: username.trim() });
      await updateSession({ username: username.trim() });
      notify("Username updated");
    } catch (err) {
      handleError(err);
    } finally {
      setSavingUsername(false);
    }
  };

  const saveTimezone = async () => {
    if (!timezone) return;
    setSavingTimezone(true);
    try {
      await updateProfileMutation.mutateAsync({ timezone });
      await updateSession({ timezone });
      notify("Timezone updated");
    } catch (err) {
      handleError(err);
    } finally {
      setSavingTimezone(false);
    }
  };

  const savePlanReminder = async () => {
    setSavingPlan(true);
    try {
      await updateProfileMutation.mutateAsync({
        planReminderEnabled: planEnabled,
        planReminderTime: planTime,
      });
      notify("Plan reminder saved");
    } catch (err) {
      handleError(err);
    } finally {
      setSavingPlan(false);
    }
  };

  const saveEodReminder = async () => {
    setSavingEod(true);
    try {
      await updateProfileMutation.mutateAsync({
        endOfDayReminderEnabled: eodEnabled,
        endOfDayReminderTime: eodTime,
      });
      notify("End-of-day reminder saved");
    } catch (err) {
      handleError(err);
    } finally {
      setSavingEod(false);
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
        <div className={styles.field}>
          <label htmlFor="username">Username</label>
          <div className={styles.inlineRow}>
            <InputText
              id="username"
              value={username ?? ""}
              onChange={(e) => setUsername(e.target.value)}
              className={styles.inlineInput}
            />
            <Button
              icon="pi pi-check"
              onClick={saveUsername}
              loading={savingUsername}
              aria-label="Save username"
            />
          </div>
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

      <Card title="Push notifications" className={styles.card}>
        <p className={styles.helperText}>
          {isPushSupported()
            ? "Turn this on to actually receive the reminders below as OS notifications on this device."
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

      <Card title="Plan reminder" className={styles.card}>
        <p className={styles.helperText}>
          Tells you what you planned for today, at whatever time you set below.
        </p>
        <div className={styles.reminderRow}>
          <InputSwitch checked={planEnabled} onChange={(e) => setPlanEnabled(!!e.value)} />
          <input
            type="time"
            value={planTime}
            onChange={(e) => setPlanTime(e.target.value)}
            disabled={!planEnabled}
            className={styles.timeInput}
          />
          <Button
            label="Save"
            icon="pi pi-check"
            onClick={savePlanReminder}
            loading={savingPlan}
          />
        </div>
      </Card>

      <Card title="End-of-day reminder" className={styles.card}>
        <p className={styles.helperText}>
          If tasks are still pending late in the day, nudges you to tick, move, or delete them
          before the day ends.
        </p>
        <div className={styles.reminderRow}>
          <InputSwitch checked={eodEnabled} onChange={(e) => setEodEnabled(!!e.value)} />
          <input
            type="time"
            value={eodTime}
            onChange={(e) => setEodTime(e.target.value)}
            disabled={!eodEnabled}
            className={styles.timeInput}
          />
          <Button label="Save" icon="pi pi-check" onClick={saveEodReminder} loading={savingEod} />
        </div>
      </Card>

      <Card title="Timezone" className={styles.card}>
        <p className={styles.helperText}>
          Used to figure out when &ldquo;today&rdquo; starts, and when your reminder times above
          are checked.
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
