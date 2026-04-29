import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { csvFilename } from "@/lib/filenames";
import { effectiveInvoiceStatus } from "@/lib/invoice-status";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { taxModeLabel } from "@/lib/tax-modes";

export const runtime = "nodejs";

function csvCell(value: unknown): string {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Nicht angemeldet", { status: 401 });

  const invoices = await prisma.invoice.findMany({
    where: { userId: user.id },
    include: { customer: true },
    orderBy: { invoiceDate: "desc" }
  });

  const rows = [
    [
      "Rechnungsnummer",
      "Kunde",
      "Rechnungsdatum",
      "Faellig",
      "Status",
      "Steuerfall",
      "Netto",
      "Steuer",
      "Brutto"
    ],
    ...invoices.map((invoice) => [
      invoice.number,
      invoice.customer.name,
      formatDate(invoice.invoiceDate),
      formatDate(invoice.dueDate),
      effectiveInvoiceStatus(invoice.status, invoice.dueDate),
      taxModeLabel(invoice.taxMode),
      formatMoney(invoice.subtotalNetCents),
      formatMoney(invoice.taxTotalCents),
      formatMoney(invoice.totalGrossCents)
    ])
  ];

  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(";")).join("\n")}`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${csvFilename("rechnungen")}"`
    }
  });
}
