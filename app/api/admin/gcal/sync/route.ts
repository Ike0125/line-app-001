import { NextResponse } from "next/server";
import { google } from "googleapis";
import { prisma } from "@/app/_lib/prisma";

function jstRange(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00+09:00`);
  const end = new Date(`${endDate}T00:00:00+09:00`);
  end.setDate(end.getDate() + 1); // 終了日当日を含める
  return { timeMin: start.toISOString(), timeMax: end.toISOString() };
}

export async function POST(req: Request) {
  try {
    // ✅ req はここでしか使えない
    let payload: any;
    try {
      payload = await req.json();
    } catch {
      return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
    }

    console.log("SYNC payload:", payload);

    const { startDate, endDate } = payload ?? {};
    if (!startDate || !endDate) {
      return NextResponse.json({ message: "startDate/endDate required" }, { status: 400 });
    }
    if (startDate > endDate) {
      return NextResponse.json({ message: "startDate must be <= endDate" }, { status: 400 });
    }

    // refresh_token を取得
    const email = process.env.GCAL_SYNC_EMAIL;
    if (!email) return NextResponse.json({ message: "GCAL_SYNC_EMAIL missing" }, { status: 500 });

    const authRow = await prisma.googleAuth.findUnique({
      where: { email },
    });

    if (!authRow) {
      return NextResponse.json({ message: "Google not linked yet" }, { status: 400 });
    }

    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      process.env.GOOGLE_REDIRECT_URI!
    );
    oauth2.setCredentials({ refresh_token: authRow.refreshToken });

    const calendar = google.calendar({ version: "v3", auth: oauth2 });

    const { timeMin, timeMax } = jstRange(startDate, endDate);

    const calendarId = process.env.GCAL_CALENDAR_ID ?? "primary";
    console.log("GCAL sync target:", { email, calendarId });

    const res = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 250,
    });

    const items = res.data.items ?? [];
    let upserted = 0;

    for (const e of items) {
      if (!e.id) continue;

      const startRaw = e.start?.dateTime ?? e.start?.date;
      if (!startRaw) continue;

      const endRaw = e.end?.dateTime ?? e.end?.date ?? null;

      const startAt = new Date(startRaw);
      const endAt = endRaw ? new Date(endRaw) : null;

      await prisma.event.upsert({
        where: { gcalEventId: e.id },
        create: {
          gcalEventId: e.id,
          gcalUpdatedAt: e.updated ? new Date(e.updated) : null,

          title: e.summary ?? "(no title)",
          memo: e.description ?? null,

          // date=開始, endAt=終了
          date: startAt,
          endAt: endAt,

          place: e.location ?? null,
          fee: null,
          deadline: null,
          isActive: false,
        },
        update: {
          gcalUpdatedAt: e.updated ? new Date(e.updated) : null,
          title: e.summary ?? "(no title)",
          memo: e.description ?? null,

          date: startAt,
          endAt: endAt,

          place: e.location ?? null,
        },
      });

      upserted++;
    }

    return NextResponse.json({
      message: "sync ok",
      fetched: items.length,
      upserted,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ message: e.message ?? "sync failed" }, { status: 500 });
  }
}
