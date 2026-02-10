import { NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma";

export async function POST(req: Request) {
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const { eventId } = payload ?? {};
  if (!eventId) {
    return NextResponse.json({ message: "eventId required" }, { status: 400 });
  }

  // トランザクションで安全に
  await prisma.$transaction([
    prisma.event.updateMany({ data: { isActive: false } }),
    prisma.event.update({ where: { id: eventId }, data: { isActive: true } }),
  ]);

  return NextResponse.json({ message: "activated", eventId });
}
