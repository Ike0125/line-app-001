import { NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma";
import { requireUserId } from "@/app/_lib/requireUserId";
import { getCurrentEvent } from "@/app/_lib/currentEvent";

export async function GET() {
  try {
    const userId = await requireUserId();
    const event = await getCurrentEvent();
    if (!event) return NextResponse.json({ event: null, rsvp: null });

    const rsvp = await prisma.rsvp.findUnique({
      where: { eventId_userId: { eventId: event.id, userId } },
    });

    return NextResponse.json({ event, rsvp });
  } catch (e: any) {
    if (String(e?.message) === "UNAUTHORIZED") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
