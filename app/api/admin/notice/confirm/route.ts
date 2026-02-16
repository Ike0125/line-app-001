import { prisma } from "@/app/_lib/prisma";
import { requireNoticeEditorUserId } from "@/app/_lib/requireNoticeEditor";

const STATUS_OPTIONS = ["初期設定", "開催", "中止", "お知らせ", "非表示"] as const;

export async function POST(request: Request) {
  const userId = await requireNoticeEditorUserId();
  const formData = await request.formData();

  const eventId = String(formData.get("eventId") ?? "");
  const status = String(formData.get("status") ?? "");
  const message = String(formData.get("message") ?? "");

  if (!eventId) return new Response("eventId required", { status: 400 });
  if (!STATUS_OPTIONS.includes(status as any)) {
    return new Response("invalid status", { status: 400 });
  }

  const trimmedMessage = message.trim();
  const existing = await prisma.eventNotice.findUnique({ where: { eventId } });

  if (!existing) {
    await prisma.eventNotice.create({
      data: {
        eventId,
        status,
        message: trimmedMessage,
        draftStatus: status,
        draftMessage: trimmedMessage,
        updatedByUserId: userId,
        isPublished: false,
        publishedAt: null,
      },
    });
  } else if (existing.isPublished) {
    await prisma.eventNotice.update({
      where: { eventId },
      data: {
        draftStatus: status,
        draftMessage: trimmedMessage,
        updatedByUserId: userId,
      },
    });
  } else {
    await prisma.eventNotice.update({
      where: { eventId },
      data: {
        status,
        message: trimmedMessage,
        draftStatus: status,
        draftMessage: trimmedMessage,
        updatedByUserId: userId,
        isPublished: false,
        publishedAt: null,
      },
    });
  }

  return Response.json({ ok: true });
}
