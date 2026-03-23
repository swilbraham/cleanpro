import { prisma } from "./prisma";

export async function getNextNumber(
  type: "quote" | "job" | "invoice"
): Promise<string> {
  const result = await prisma.sequence.update({
    where: { id: type },
    data: { current: { increment: 1 } },
  });

  const prefix = { quote: "Q", job: "J", invoice: "INV" }[type];
  return `${prefix}-${String(result.current).padStart(4, "0")}`;
}
