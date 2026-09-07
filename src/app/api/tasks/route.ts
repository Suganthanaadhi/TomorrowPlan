import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createTask, listAllTasks, listTasksByDate } from "@/lib/mock-store";
import { taskCreateSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const date = request.nextUrl.searchParams.get("date");
  const tasks = date
    ? listTasksByDate(session.user.id, date)
    : listAllTasks(session.user.id);
  return NextResponse.json(tasks);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const result = taskCreateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0]?.message }, { status: 400 });
  }

  const task = createTask(session.user.id, result.data);
  return NextResponse.json(task, { status: 201 });
}
