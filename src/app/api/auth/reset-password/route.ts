import { NextRequest, NextResponse } from "next/server";
import { consumeResetToken, updatePassword } from "@/lib/mock-users";
import { resetPasswordSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const result = resetPasswordSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0]?.message }, { status: 400 });
  }

  const user = consumeResetToken(result.data.token);
  if (!user) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired" },
      { status: 400 },
    );
  }

  updatePassword(user.id, result.data.password);
  return NextResponse.json({ ok: true });
}
