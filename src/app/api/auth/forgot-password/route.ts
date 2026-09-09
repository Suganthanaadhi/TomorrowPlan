import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validation";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const result = forgotPasswordSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0]?.message }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: result.data.email } });
  if (user) {
    const token = crypto.randomUUID();
    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    });
    const origin = request.nextUrl.origin;
    await sendPasswordResetEmail(user.email, `${origin}/reset-password?token=${token}`);
  }

  // Always return success, whether or not the email exists, so the response
  // can't be used to enumerate registered accounts.
  return NextResponse.json({ ok: true });
}
