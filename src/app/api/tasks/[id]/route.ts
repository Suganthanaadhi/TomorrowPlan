import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteTask, updateTask } from "@/lib/mock-store";
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

  const task = updateTask(session.user.id, id, result.data);
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  return NextResponse.json(task);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const removed = deleteTask(session.user.id, id);
  if (!removed) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
