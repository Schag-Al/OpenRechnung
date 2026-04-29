import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { csvFilename } from "@/lib/filenames";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function csvCell(value: unknown): string {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Nicht angemeldet", { status: 401 });

  const customers = await prisma.customer.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" }
  });

  const rows = [
    ["Name", "Ansprechpartner", "Strasse", "PLZ", "Ort", "Land", "E-Mail", "Telefon", "UID/USt-ID", "Notizen"],
    ...customers.map((customer) => [
      customer.name,
      customer.contactPerson,
      customer.street,
      customer.postalCode,
      customer.city,
      customer.country,
      customer.email,
      customer.phone,
      customer.vatId,
      customer.notes
    ])
  ];

  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(";")).join("\n")}`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${csvFilename("kunden")}"`
    }
  });
}
