import { NextRequest, NextResponse } from "next/server";
import { createUser, findUserByEmail, findUserByUsername } from "@/lib/mock-users";
import { registerApiSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const result = registerApiSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0]?.message }, { status: 400 });
  }

  const { username, email, password, timezone } = result.data;

  if (findUserByUsername(username)) {
    return NextResponse.json({ error: "That username is already taken" }, { status: 409 });
  }
  if (findUserByEmail(email)) {
    return NextResponse.json({ error: "That email is already registered" }, { status: 409 });
  }

  createUser({ username, email, password, timezone });
  return NextResponse.json({ ok: true }, { status: 201 });
}
