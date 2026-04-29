"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeTaxMode } from "@/lib/tax-modes";
import { isPlausibleIban, isPlausibleVatId, isValidEmail, normalizeIban } from "@/lib/validation";

function text(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value.length > 0 ? value : null;
}

function numberValue(formData: FormData, key: string, fallback: number): number {
  const raw = String(formData.get(key) ?? "").replace(",", ".").trim();
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function cleanPrefix(value: string | null, fallback: string): string {
  const cleaned = String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
  return cleaned || fallback;
}

function cleanBrandColor(value: string | null): string {
  const color = String(value ?? "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : "#0f766e";
}

async function logoDataUrl(formData: FormData): Promise<string | null | undefined> {
  if (formData.get("removeLogo") === "true") return null;

  const logo = formData.get("logo");
  if (!(logo instanceof File) || logo.size === 0) return undefined;
  if (!["image/png", "image/jpeg"].includes(logo.type)) return undefined;
  if (logo.size > 500_000) return undefined;

  const buffer = Buffer.from(await logo.arrayBuffer());
  return `data:${logo.type};base64,${buffer.toString("base64")}`;
}

export async function saveCompanyAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const companyName = text(formData, "companyName");
  const email = text(formData, "email");
  const iban = normalizeIban(text(formData, "iban"));
  const vatId = text(formData, "vatId");

  if (!companyName) redirect("/firma?error=companyName");
  if (!isValidEmail(email)) redirect("/firma?error=email");
  if (!isPlausibleIban(iban)) redirect("/firma?error=iban");
  if (!isPlausibleVatId(vatId)) redirect("/firma?error=vatId");

  const uploadedLogo = await logoDataUrl(formData);
  const baseData = {
    companyName,
    ownerName: text(formData, "ownerName"),
    street: text(formData, "street"),
    postalCode: text(formData, "postalCode"),
    city: text(formData, "city"),
    country: text(formData, "country") ?? "Oesterreich",
    email,
    phone: text(formData, "phone"),
    website: text(formData, "website"),
    vatId,
    taxNumber: text(formData, "taxNumber"),
    bankName: text(formData, "bankName"),
    iban,
    bic: text(formData, "bic"),
    defaultPaymentDays: Math.max(Math.round(numberValue(formData, "defaultPaymentDays", 14)), 0),
    defaultTaxRate: Math.max(numberValue(formData, "defaultTaxRate", 20), 0),
    defaultTaxMode: normalizeTaxMode(formData.get("defaultTaxMode")),
    brandColor: cleanBrandColor(text(formData, "brandColor")),
    quotePrefix: cleanPrefix(text(formData, "quotePrefix"), "ANG"),
    invoicePrefix: cleanPrefix(text(formData, "invoicePrefix"), "RE"),
    quoteIntroText: text(formData, "quoteIntroText"),
    quoteOutroText: text(formData, "quoteOutroText"),
    invoiceIntroText: text(formData, "invoiceIntroText"),
    invoiceOutroText: text(formData, "invoiceOutroText")
  };

  await prisma.companyProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      ...baseData,
      logoDataUrl: uploadedLogo ?? null
    },
    update: {
      ...baseData,
      ...(uploadedLogo !== undefined ? { logoDataUrl: uploadedLogo } : {})
    }
  });

  revalidatePath("/firma");
  redirect("/firma?saved=1");
}
