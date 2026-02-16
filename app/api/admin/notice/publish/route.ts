import { prisma } from "@/app/_lib/prisma";
import { requireNoticeEditorUserId } from "@/app/_lib/requireNoticeEditor";

export async function POST(request: Request) {
  const userId = await requireNoticeEditorUserId();
  const formData = await request.formData();

  const eventId = String(formData.get("eventId") ?? "");
  if (!eventId) return new Response("eventId required", { status: 400 });

  const existing = await prisma.eventNotice.findUnique({ where: { eventId } });
  if (!existing) return new Response("not found", { status: 404 });

  await prisma.eventNotice.update({
    where: { eventId },
    data: {
      status: existing.draftStatus ?? existing.status,
      message: existing.draftMessage ?? existing.message,
      draftStatus: null,
      draftMessage: null,
      isPublished: true,
      publishedAt: new Date(),
      updatedByUserId: userId,
    },
  });

  return Response.json({ ok: true });
}
