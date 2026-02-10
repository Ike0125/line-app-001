import { NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma";

function jstDayRange(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00+09:00`);
  const end = new Date(`${endDate}T00:00:00+09:00`);
  end.setDate(end.getDate() + 1); // 終了日当日を含める
  return { start, end };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!startDate || !endDate) {
    return NextResponse.json(
      { message: "startDate/endDate required" },
      { status: 400 }
    );
  }
  if (startDate > endDate) {
    return NextResponse.json(
      { message: "startDate must be <= endDate" },
      { status: 400 }
    );
  }

  const { start, end } = jstDayRange(startDate, endDate);

  const events = await prisma.event.findMany({
    where: {
      date: {
        gte: start,
        lt: end,
      },
    },
    orderBy: { date: "asc" },
    select: {
      id: true,
      title: true,
      memo: true,
      date: true,
      endAt: true,
      place: true,
      fee: true,
      isActive: true,
      gcalEventId: true,
    },
  });

  return NextResponse.json({ events });
}
