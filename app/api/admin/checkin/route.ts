import { NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isAdmin } from "@/app/_lib/auth-utils";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const { eventId, userId, action } = body as {
    eventId: string;
    userId: string;
    action: "checkin" | "undo";
  };

  if (!eventId || !userId || (action !== "checkin" && action !== "undo")) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const updated = await prisma.rsvp.update({
    where: { eventId_userId: { eventId, userId } },
    data: { checkedInAt: action === "checkin" ? new Date() : null },
  });

  return NextResponse.json({ ok: true, rsvp: updated });
}
