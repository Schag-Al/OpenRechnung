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
  const [invoice, company] = await Promise.all([
    prisma.invoice.findFirst({
      where: { id, userId: user.id },
      include: { customer: true, items: { orderBy: { sortOrder: "asc" } } }
    }),
    prisma.companyProfile.findUnique({ where: { userId: user.id } })
  ]);

  if (!invoice) return new NextResponse("Nicht gefunden", { status: 404 });

  const pdf = await buildDocumentPdf({
    kind: "Rechnung",
    number: invoice.number,
    company,
    customer: invoice.customer,
    date: invoice.invoiceDate,
    secondaryDateLabel: "Leistungsdatum",
    secondaryDate: invoice.serviceDate,
    servicePeriod: invoice.servicePeriod,
    paymentDueDate: invoice.dueDate,
    items: invoice.items,
    subtotalNetCents: invoice.subtotalNetCents,
    taxTotalCents: invoice.taxTotalCents,
    totalGrossCents: invoice.totalGrossCents,
    introText: invoice.introText,
    outroText: invoice.outroText,
    note: invoice.note,
    taxMode: invoice.taxMode
  });

  const filename = documentFilename("rechnung", invoice.number, invoice.customer.name, invoice.invoiceDate);

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}
