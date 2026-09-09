import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeTask, toDbDate } from "@/lib/serialize";
import { taskUpdateSchema } from "@/lib/validation";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const result = taskUpdateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0]?.message }, { status: 400 });
  }

  const existing = await prisma.task.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const { date, ...rest } = result.data;
  const task = await prisma.task.update({
    where: { id },
    data: { ...rest, ...(date ? { date: toDbDate(date) } : {}) },
  });
  return NextResponse.json(serializeTask(task));
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.task.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  await prisma.task.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
