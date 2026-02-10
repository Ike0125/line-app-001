import { prisma } from "@/app/_lib/prisma";

export async function getCurrentEvent() {
  return prisma.event.findFirst({
    where: { isActive: true },
    orderBy: { date: "asc" },
    select: {
      id: true,
      title: true,
      memo: true,
      date: true,    // 開始
      endAt: true,   // 終了
      deadline: true,
      place: true,
      fee: true,
      isActive: true,
      gcalEventId: true,
      gcalUpdatedAt: true,
    },
  });
}
