import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listOverdueTasks } from "@/lib/mock-store";
import { todayISO } from "@/lib/date";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json(listOverdueTasks(session.user.id, todayISO()));
}
