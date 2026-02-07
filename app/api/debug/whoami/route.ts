import { NextResponse } from "next/server";
import { requireUserId } from "@/app/_lib/requireUserId";
import { getCurrentEvent } from "@/app/_lib/currentEvent";

export async function GET() {
  try {
    const userId = await requireUserId();
    const event = await getCurrentEvent();

    console.log("[whoami]", { userId, eventId: event?.id ?? null });

    return NextResponse.json({
      ok: true,
      userId,
      currentEvent: event
        ? { id: event.id, title: event.title, isActive: event.isActive }
        : null,
    });
  } catch (e: any) {
    if (String(e?.message) === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
