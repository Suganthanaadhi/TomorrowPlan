import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeTask, toDbDate } from "@/lib/serialize";
import { taskCreateSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const date = request.nextUrl.searchParams.get("date");
  const tasks = await prisma.task.findMany({
    where: {
      userId: session.user.id,
      ...(date ? { date: toDbDate(date) } : {}),
    },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(tasks.map(serializeTask));
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const result = taskCreateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0]?.message }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      userId: session.user.id,
      text: result.data.text,
      date: toDbDate(result.data.date),
      notify: result.data.notify ?? false,
    },
  });
  return NextResponse.json(serializeTask(task), { status: 201 });
}
