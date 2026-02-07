import { NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma";
import { requireUserId } from "@/app/_lib/requireUserId";

export async function GET() {
  try {
    const userId = await requireUserId();

    const rows = await prisma.rsvp.findMany({
      where: { userId },
      include: { event: true },
      orderBy: { updatedAt: "desc" },
    });

    // 返す項目を絞る（UIで扱いやすく）
    const history = rows.map((r) => ({
      eventId: r.eventId,
      title: r.event.title,
      date: r.event.date,
      place: r.event.place,
      fee: r.event.fee,
      memo: r.event.memo,
      status: r.status, // join / absent
      checkedInAt: r.checkedInAt,
      comment: r.comment ?? "",
      updatedAt: r.updatedAt,
    }));

    return NextResponse.json({ ok: true, history });
  } catch (e: any) {
    if (String(e?.message) === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
