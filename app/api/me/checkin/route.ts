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

    // 返す項目を絞り、Dateオブジェクトを文字列に変換する
    const history = rows.map((r) => ({
      eventId: r.eventId,
      title: r.event.title,
      // Date型を文字列（ISO形式）に変換
      date: r.event.date instanceof Date ? r.event.date.toISOString() : r.event.date,
      place: r.event.place,
      fee: r.event.fee,
      memo: r.event.memo,
      status: r.status, // join / absent
      // Date型を文字列に変換（nullの場合はそのまま）
      checkedInAt: r.checkedInAt instanceof Date ? r.checkedInAt.toISOString() : r.checkedInAt,
      comment: r.comment ?? "",
      // Date型を文字列に変換
      updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : r.updatedAt,
    }));

    return NextResponse.json({ ok: true, history });
  } catch (e: any) {
    if (String(e?.message) === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}