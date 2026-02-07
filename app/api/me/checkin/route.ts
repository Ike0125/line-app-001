import { NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma";
import { requireUserId } from "@/app/_lib/requireUserId";
import { getCurrentEvent } from "@/app/_lib/currentEvent";

export async function POST() {
  try {
    const userId = await requireUserId();
    const event = await getCurrentEvent();
    if (!event) return NextResponse.json({ error: "no_active_event" }, { status: 400 });

    const rsvp = await prisma.rsvp.findUnique({
      where: { eventId_userId: { eventId: event.id, userId } },
    });

    // 参加（join）の人だけ受付可能
    if (!rsvp || rsvp.status !== "join") {
      return NextResponse.json({ error: "not_join" }, { status: 400 });
    }

    if (rsvp.checkedInAt) {
      return NextResponse.json({
        ok: true,
        message: "already_checked_in",
        rsvp,
      });
    }

    const updated = await prisma.rsvp.update({
      where: { eventId_userId: { eventId: event.id, userId } },
      data: { checkedInAt: new Date() },
    });

    return NextResponse.json({ ok: true, rsvp: updated });
  } catch (e: any) {
    if (String(e?.message) === "UNAUTHORIZED") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
