import { NextRequest, NextResponse } from "next/server";
import { createResetToken, findUserByEmail } from "@/lib/mock-users";
import { forgotPasswordSchema } from "@/lib/validation";

// TEMPORARY: no email service is wired up yet, so instead of sending a real
// email, the reset link is logged to the server console. Swap this for
// Resend once that's ready — the route's request/response shape won't change.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const result = forgotPasswordSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0]?.message }, { status: 400 });
  }

  const user = findUserByEmail(result.data.email);
  if (user) {
    const token = createResetToken(user.id);
    const origin = request.nextUrl.origin;
    console.log(`[mock email] Password reset for ${user.email}: ${origin}/reset-password?token=${token}`);
  }

  // Always return success, whether or not the email exists, so the response
  // can't be used to enumerate registered accounts.
  return NextResponse.json({ ok: true });
}
