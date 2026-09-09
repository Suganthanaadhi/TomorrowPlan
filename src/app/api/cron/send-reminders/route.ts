import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { prisma } from "@/lib/prisma";
import { toDbDate } from "@/lib/serialize";
import { currentTimeInTimezone, isWithinWindow, todayInTimezone } from "@/lib/reminder-time";
import { sendToSubscriptions } from "@/lib/push-send";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:example@example.com";

// "Plan reminder": tells the user what they planned for *today*, once per
// day, at their own preferred time (User.planReminderTime). Call this
// endpoint often (e.g. every 15-30 min via an external cron pinger) for the
// per-user time to actually be honored — see reminder-time.ts.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return NextResponse.json({ error: "Push isn't configured" }, { status: 500 });
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  const users = await prisma.user.findMany({
    where: { planReminderEnabled: true },
    include: { subscriptions: true },
  });

  let sent = 0;
  let skipped = 0;
  const errors: unknown[] = [];

  for (const user of users) {
    if (user.subscriptions.length === 0) continue;
    if (!isWithinWindow(currentTimeInTimezone(user.timezone), user.planReminderTime)) continue;

    const todayStr = todayInTimezone(user.timezone);
    const todayDate = toDbDate(todayStr);

    const alreadySent = await prisma.reminderLog.findUnique({
      where: { userId_date_kind: { userId: user.id, date: todayDate, kind: "PLAN" } },
    });
    if (alreadySent) {
      skipped++;
      continue;
    }

    const tasksToday = await prisma.task.findMany({
      where: { userId: user.id, date: todayDate, notify: true },
      orderBy: { createdAt: "asc" },
    });
    if (tasksToday.length === 0) continue;

    const body =
      tasksToday.length === 1
        ? tasksToday[0].text
        : `Today: ${tasksToday.map((t) => t.text).join(", ")}`;
    const payload = JSON.stringify({ title: "TomorrowPlan", body });

    const result = await sendToSubscriptions(
      user.subscriptions,
      payload,
      "send-reminders push failed",
    );
    sent += result.sent;
    errors.push(...result.errors);

    await prisma.reminderLog.create({
      data: { userId: user.id, date: todayDate, kind: "PLAN" },
    });
  }

  return NextResponse.json({ ok: true, sent, skipped, errors });
}
