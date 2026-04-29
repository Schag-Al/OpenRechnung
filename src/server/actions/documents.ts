"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { addDays, parseDate } from "@/lib/dates";
import { normalizeInvoiceStatusForSave } from "@/lib/invoice-status";
import { nextInvoiceNumber, nextQuoteNumber } from "@/lib/numbering";
import { prisma } from "@/lib/prisma";
import { normalizeTaxMode } from "@/lib/tax-modes";
import { calculateTotals, parseLineItems } from "@/lib/totals";
import { isPlausibleVatId, isValidEmail } from "@/lib/validation";

function text(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value.length > 0 ? value : null;
}

function requiredDate(formData: FormData, key: string, fallback = new Date()): Date {
  return parseDate(formData.get(key)) ?? fallback;
}

async function assertCustomer(userId: string, customerId: string): Promise<void> {
  const customer = await prisma.customer.findFirst({ where: { id: customerId, userId } });
  if (!customer) redirect("/kunden?error=missing-customer");
}

async function resolveCustomerId(userId: string, formData: FormData, fallbackPath: string): Promise<string> {
  if (String(formData.get("customerMode") ?? "existing") === "manual") {
    const name = text(formData, "customerName");
    const email = text(formData, "customerEmail");
    const vatId = text(formData, "customerVatId");

    if (!name) redirect(`${fallbackPath}?error=customer`);
    if (!isValidEmail(email)) redirect(`${fallbackPath}?error=customerEmail`);
    if (!isPlausibleVatId(vatId)) redirect(`${fallbackPath}?error=customerVatId`);

    const customer = await prisma.customer.create({
      data: {
        userId,
        name,
        contactPerson: text(formData, "customerContactPerson"),
        street: text(formData, "customerStreet"),
        postalCode: text(formData, "customerPostalCode"),
        city: text(formData, "customerCity"),
        country: text(formData, "customerCountry") ?? "Oesterreich",
        email,
        phone: text(formData, "customerPhone"),
        vatId,
        notes: text(formData, "customerNotes")
      }
    });

    revalidatePath("/kunden");
    return customer.id;
  }

  const customerId = String(formData.get("customerId") ?? "");
  await assertCustomer(userId, customerId);
  return customerId;
}

function lockDateForStatus(status: string): Date | null {
  return status === "DRAFT" ? null : new Date();
}

export async function createQuoteAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const customerId = await resolveCustomerId(user.id, formData, "/angebote/neu");

  const items = parseLineItems(formData);
  if (items.length === 0) redirect("/angebote/neu?error=items");

  const taxMode = normalizeTaxMode(formData.get("taxMode"));
  const status = String(formData.get("status") ?? "DRAFT");
  const totals = calculateTotals(items, taxMode);

  const quote = await prisma.quote.create({
    data: {
      userId: user.id,
      customerId,
      number: await nextQuoteNumber(user.id),
      status,
      taxMode,
      quoteDate: requiredDate(formData, "quoteDate"),
      validUntil: parseDate(formData.get("validUntil")),
      introText: text(formData, "introText"),
      outroText: text(formData, "outroText"),
      note: text(formData, "note"),
      lockedAt: lockDateForStatus(status),
      ...totals,
      items: {
        create: items
      }
    }
  });

  revalidatePath("/angebote");
  redirect(`/angebote/${quote.id}`);
}

export async function updateQuoteAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");

  const quote = await prisma.quote.findFirst({ where: { id, userId: user.id } });
  if (!quote) redirect("/angebote?error=missing");
  if (quote.status !== "DRAFT" || quote.lockedAt) redirect(`/angebote/${id}?error=locked`);

  const customerId = await resolveCustomerId(user.id, formData, `/angebote/${id}`);

  const items = parseLineItems(formData);
  if (items.length === 0) redirect(`/angebote/${id}?error=items`);

  const taxMode = normalizeTaxMode(formData.get("taxMode"));
  const status = String(formData.get("status") ?? "DRAFT");
  const totals = calculateTotals(items, taxMode);

  await prisma.$transaction(async (tx) => {
    await tx.quoteItem.deleteMany({ where: { quoteId: id } });
    await tx.quote.update({
      where: { id },
      data: {
        customerId,
        status,
        taxMode,
        quoteDate: requiredDate(formData, "quoteDate"),
        validUntil: parseDate(formData.get("validUntil")),
        introText: text(formData, "introText"),
        outroText: text(formData, "outroText"),
        note: text(formData, "note"),
        lockedAt: lockDateForStatus(status),
        ...totals
      }
    });
    await Promise.all(items.map((item) => tx.quoteItem.create({ data: { ...item, quoteId: id } })));
  });

  revalidatePath("/angebote");
  redirect(`/angebote/${id}?saved=1`);
}

export async function convertQuoteToInvoiceAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");

  const quote = await prisma.quote.findFirst({
    where: { id, userId: user.id },
    include: { items: true }
  });

  if (!quote) redirect("/angebote?error=missing");

  const existingInvoice = await prisma.invoice.findFirst({
    where: { userId: user.id, quoteId: quote.id }
  });

  if (existingInvoice) {
    redirect(`/rechnungen/${existingInvoice.id}`);
  }

  const company = await prisma.companyProfile.findUnique({ where: { userId: user.id } });
  const invoiceDate = new Date();
  const dueDate = addDays(invoiceDate, company?.defaultPaymentDays ?? 14);

  const invoice = await prisma.invoice.create({
    data: {
      userId: user.id,
      customerId: quote.customerId,
      quoteId: quote.id,
      number: await nextInvoiceNumber(user.id),
      status: "OPEN",
      taxMode: quote.taxMode,
      invoiceDate,
      dueDate,
      introText: company?.invoiceIntroText ?? quote.introText,
      outroText: company?.invoiceOutroText ?? quote.outroText,
      note: quote.note,
      subtotalNetCents: quote.subtotalNetCents,
      taxTotalCents: quote.taxTotalCents,
      totalGrossCents: quote.totalGrossCents,
      lockedAt: invoiceDate,
      items: {
        create: quote.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPriceNetCents: item.unitPriceNetCents,
          taxRate: item.taxRate,
          materialCostCents: item.materialCostCents,
          laborHours: item.laborHours,
          sortOrder: item.sortOrder
        }))
      }
    }
  });

  await prisma.quote.update({
    where: { id: quote.id },
    data: { status: "ACCEPTED", lockedAt: quote.lockedAt ?? new Date() }
  });

  revalidatePath("/angebote");
  revalidatePath("/rechnungen");
  redirect(`/rechnungen/${invoice.id}`);
}

export async function createInvoiceAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const customerId = await resolveCustomerId(user.id, formData, "/rechnungen/neu");

  const items = parseLineItems(formData);
  if (items.length === 0) redirect("/rechnungen/neu?error=items");

  const taxMode = normalizeTaxMode(formData.get("taxMode"));
  const invoiceDate = requiredDate(formData, "invoiceDate");
  const dueDate = parseDate(formData.get("dueDate")) ?? addDays(invoiceDate, 14);
  const status = normalizeInvoiceStatusForSave(String(formData.get("status") ?? "DRAFT"), dueDate);
  const totals = calculateTotals(items, taxMode);

  const invoice = await prisma.invoice.create({
    data: {
      userId: user.id,
      customerId,
      number: await nextInvoiceNumber(user.id),
      status,
      taxMode,
      invoiceDate,
      serviceDate: parseDate(formData.get("serviceDate")),
      servicePeriod: text(formData, "servicePeriod"),
      dueDate,
      introText: text(formData, "introText"),
      outroText: text(formData, "outroText"),
      note: text(formData, "note"),
      paidAt: status === "PAID" ? new Date() : null,
      lockedAt: lockDateForStatus(status),
      ...totals,
      items: {
        create: items
      }
    }
  });

  revalidatePath("/rechnungen");
  redirect(`/rechnungen/${invoice.id}`);
}

export async function updateInvoiceAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");

  const invoice = await prisma.invoice.findFirst({ where: { id, userId: user.id } });
  if (!invoice) redirect("/rechnungen?error=missing");
  if (invoice.status !== "DRAFT" || invoice.lockedAt) redirect(`/rechnungen/${id}?error=locked`);

  const customerId = await resolveCustomerId(user.id, formData, `/rechnungen/${id}`);

  const items = parseLineItems(formData);
  if (items.length === 0) redirect(`/rechnungen/${id}?error=items`);

  const taxMode = normalizeTaxMode(formData.get("taxMode"));
  const invoiceDate = requiredDate(formData, "invoiceDate");
  const dueDate = parseDate(formData.get("dueDate")) ?? addDays(invoiceDate, 14);
  const status = normalizeInvoiceStatusForSave(String(formData.get("status") ?? "DRAFT"), dueDate);
  const totals = calculateTotals(items, taxMode);

  await prisma.$transaction(async (tx) => {
    await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
    await tx.invoice.update({
      where: { id },
      data: {
        customerId,
        status,
        taxMode,
        invoiceDate,
        serviceDate: parseDate(formData.get("serviceDate")),
        servicePeriod: text(formData, "servicePeriod"),
        dueDate,
        introText: text(formData, "introText"),
        outroText: text(formData, "outroText"),
        note: text(formData, "note"),
        paidAt: status === "PAID" ? invoice.paidAt ?? new Date() : null,
        lockedAt: lockDateForStatus(status),
        ...totals
      }
    });
    await Promise.all(items.map((item) => tx.invoiceItem.create({ data: { ...item, invoiceId: id } })));
  });

  revalidatePath("/rechnungen");
  redirect(`/rechnungen/${id}?saved=1`);
}

export async function markInvoicePaidAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");

  await prisma.invoice.updateMany({
    where: { id, userId: user.id, status: { notIn: ["PAID", "CANCELLED"] } },
    data: {
      status: "PAID",
      paidAt: new Date(),
      lockedAt: new Date()
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/rechnungen");
  redirect(`/rechnungen/${id}`);
}
