import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const result = subscriptionSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0]?.message }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint: result.data.endpoint },
    create: {
      userId: session.user.id,
      endpoint: result.data.endpoint,
      p256dh: result.data.keys.p256dh,
      auth: result.data.keys.auth,
    },
    update: {
      userId: session.user.id,
      p256dh: result.data.keys.p256dh,
      auth: result.data.keys.auth,
    },
  });

  return NextResponse.json({ ok: true });
}

const unsubscribeSchema = z.object({ endpoint: z.string().url() });

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const result = unsubscribeSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0]?.message }, { status: 400 });
  }

  await prisma.pushSubscription.deleteMany({
    where: { endpoint: result.data.endpoint, userId: session.user.id },
  });

  return NextResponse.json({ ok: true });
}
