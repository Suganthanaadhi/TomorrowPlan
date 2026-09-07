import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteUser, updateTimezone } from "@/lib/mock-users";
import { deleteAllTasksForUser } from "@/lib/mock-store";
import { z } from "zod";

const updateProfileSchema = z.object({
  timezone: z.string().min(1).optional(),
});

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const result = updateProfileSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0]?.message }, { status: 400 });
  }

  if (result.data.timezone) {
    updateTimezone(session.user.id, result.data.timezone);
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  deleteAllTasksForUser(session.user.id);
  deleteUser(session.user.id);
  return NextResponse.json({ ok: true });
}
