import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { prisma } from "@/lib/prisma";
import { toDbDate } from "@/lib/serialize";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:example@example.com";

function todayInTimezone(timezone: string): string {
  // en-CA formats as YYYY-MM-DD, which is exactly the string our Task.date
  // column is keyed on — this is how "today" gets computed per-user.
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date());
}

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
    include: { subscriptions: true },
  });

  let sent = 0;
  let skipped = 0;

  for (const user of users) {
    if (user.subscriptions.length === 0) continue;

    const todayStr = todayInTimezone(user.timezone);
    const todayDate = toDbDate(todayStr);

    const alreadySent = await prisma.reminderLog.findUnique({
      where: { userId_date: { userId: user.id, date: todayDate } },
    });
    if (alreadySent) {
      skipped++;
      continue;
    }

    const tasksToday = await prisma.task.count({
      where: { userId: user.id, date: todayDate, notify: true },
    });
    if (tasksToday === 0) continue;

    const payload = JSON.stringify({
      title: "TomorrowPlan",
      body: `You planned ${tasksToday} task${tasksToday === 1 ? "" : "s"} for today.`,
    });

    for (const sub of user.subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
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

    await prisma.reminderLog.create({ data: { userId: user.id, date: todayDate } });
  }

  return NextResponse.json({ ok: true, sent, skipped });
}
