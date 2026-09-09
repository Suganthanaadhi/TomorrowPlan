import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeTask, toDbDate } from "@/lib/serialize";
import { todayISO } from "@/lib/date";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tasks = await prisma.task.findMany({
    where: {
      userId: session.user.id,
      date: { lt: toDbDate(todayISO()) },
      status: { not: "COMPLETED" },
    },
    orderBy: { date: "asc" },
  });
  return NextResponse.json(tasks.map(serializeTask));
}
