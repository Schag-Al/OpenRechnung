import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { documentFilename } from "@/lib/filenames";
import { buildDocumentPdf } from "@/lib/pdf";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Nicht angemeldet", { status: 401 });

  const { id } = await context.params;
  const [quote, company] = await Promise.all([
    prisma.quote.findFirst({
      where: { id, userId: user.id },
      include: { customer: true, items: { orderBy: { sortOrder: "asc" } } }
    }),
    prisma.companyProfile.findUnique({ where: { userId: user.id } })
  ]);

  if (!quote) return new NextResponse("Nicht gefunden", { status: 404 });

  const pdf = await buildDocumentPdf({
    kind: "Angebot",
    number: quote.number,
    company,
    customer: quote.customer,
    date: quote.quoteDate,
    secondaryDateLabel: "Gueltig bis",
    secondaryDate: quote.validUntil,
    items: quote.items,
    subtotalNetCents: quote.subtotalNetCents,
    taxTotalCents: quote.taxTotalCents,
    totalGrossCents: quote.totalGrossCents,
    introText: quote.introText,
    outroText: quote.outroText,
    note: quote.note,
    taxMode: quote.taxMode
  });

  const filename = documentFilename("angebot", quote.number, quote.customer.name, quote.quoteDate);

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}
