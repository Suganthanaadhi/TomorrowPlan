import webpush from "web-push";
import { prisma } from "@/lib/prisma";

type Subscription = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

// Sends one payload to every subscription, deleting subscriptions the push
// service reports as gone (404/410) instead of retrying them forever.
export async function sendToSubscriptions(
  subscriptions: Subscription[],
  payload: string,
  logLabel: string,
) {
  let sent = 0;
  const errors: unknown[] = [];

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
      );
      sent++;
    } catch (err) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      const errBody = (err as { body?: string }).body;
      console.error(logLabel, statusCode, errBody);
      errors.push({ statusCode, body: errBody, message: (err as Error).message });
      if (statusCode === 404 || statusCode === 410) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      }
    }
  }

  return { sent, errors };
}
