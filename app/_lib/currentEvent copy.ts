import { prisma } from "@/app/_lib/prisma";

export async function getCurrentEvent() {
  return prisma.event.findFirst({
    where: { isActive: true },
  });
}
