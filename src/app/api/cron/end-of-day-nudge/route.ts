import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { prisma } from "@/lib/prisma";
import { toDbDate } from "@/lib/serialize";
import { currentTimeInTimezone, isWithinWindow, todayInTimezone } from "@/lib/reminder-time";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:example@example.com";

// "End of day nudge": if the user still has pending/in-progress tasks for
// *today* by their preferred end-of-day time, sends one reminder so nothing
// quietly falls through — tapping it opens the app to Dashboard, where they
// can tick, move to tomorrow, or delete each one directly.
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
    where: { endOfDayReminderEnabled: true },
    include: { subscriptions: true },
  });

  let sent = 0;
  let skipped = 0;

  for (const user of users) {
    if (user.subscriptions.length === 0) continue;
    if (!isWithinWindow(currentTimeInTimezone(user.timezone), user.endOfDayReminderTime)) continue;

    const todayStr = todayInTimezone(user.timezone);
    const todayDate = toDbDate(todayStr);

    const alreadySent = await prisma.reminderLog.findUnique({
      where: { userId_date_kind: { userId: user.id, date: todayDate, kind: "END_OF_DAY" } },
    });
    if (alreadySent) {
      skipped++;
      continue;
    }

    const pendingCount = await prisma.task.count({
      where: { userId: user.id, date: todayDate, status: { not: "COMPLETED" } },
    });
    if (pendingCount === 0) continue;

    const payload = JSON.stringify({
      title: "TomorrowPlan",
      body: `You still have ${pendingCount} task${pendingCount === 1 ? "" : "s"} pending today — tick, move, or clear them out.`,
    });

    for (const sub of user.subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        );
        sent++;
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    }

    await prisma.reminderLog.create({
      data: { userId: user.id, date: todayDate, kind: "END_OF_DAY" },
    });
  }

  return NextResponse.json({ ok: true, sent, skipped });
}
