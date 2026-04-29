"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { parseEuroToCents } from "@/lib/money";
import { prisma } from "@/lib/prisma";

function parseNumber(value: FormDataEntryValue | null): number {
  const parsed = Number.parseFloat(String(value ?? "0").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function calculationData(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return null;

  const materialCostCents = Math.max(parseEuroToCents(formData.get("materialCost")), 0);
  const markupPercent = Math.max(parseNumber(formData.get("markupPercent")), 0);
  const salePriceCents = Math.round(materialCostCents * (1 + markupPercent / 100));
  const laborHours = Math.max(parseNumber(formData.get("laborHours")), 0);
  const hourlyRateCents = Math.max(parseEuroToCents(formData.get("hourlyRate")), 0);
  const travelCostCents = Math.max(parseEuroToCents(formData.get("travelCost")), 0);
  const totalNetCents = salePriceCents + Math.round(laborHours * hourlyRateCents) + travelCostCents;

  return {
    title,
    materialCostCents,
    markupPercent,
    salePriceCents,
    laborHours,
    hourlyRateCents,
    travelCostCents,
    totalNetCents
  };
}

export async function createCalculationAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const data = calculationData(formData);

  if (!data) redirect("/kalkulation?error=title");

  await prisma.materialCalculation.create({
    data: {
      userId: user.id,
      ...data
    }
  });

  revalidatePath("/kalkulation");
  redirect("/kalkulation?saved=calculation");
}

export async function updateCalculationAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const data = calculationData(formData);

  if (!id || !data) redirect("/kalkulation?error=title");

  await prisma.materialCalculation.updateMany({
    where: { id, userId: user.id },
    data
  });

  revalidatePath("/kalkulation");
  redirect("/kalkulation?saved=calculation");
}

export async function deleteCalculationAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");

  await prisma.materialCalculation.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/kalkulation");
  redirect("/kalkulation");
}
