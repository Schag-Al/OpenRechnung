"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { parseEuroToCents } from "@/lib/money";
import { prisma } from "@/lib/prisma";

function text(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value.length > 0 ? value : null;
}

function numberValue(formData: FormData, key: string, fallback: number): number {
  const raw = String(formData.get(key) ?? "").replace(",", ".").trim();
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function templateKind(formData: FormData): string {
  const kind = String(formData.get("kind") ?? "SERVICE");
  return ["ARTICLE", "SERVICE"].includes(kind) ? kind : "SERVICE";
}

function templateData(formData: FormData) {
  const title = text(formData, "title");
  const description = text(formData, "description");
  if (!title || !description) return null;

  return {
    kind: templateKind(formData),
    sku: text(formData, "sku"),
    title,
    description,
    unit: text(formData, "unit") ?? "Stk.",
    unitPriceNetCents: Math.max(parseEuroToCents(formData.get("unitPriceNet")), 0),
    taxRate: Math.max(numberValue(formData, "taxRate", 20), 0),
    materialCostCents:
      String(formData.get("materialCost") ?? "").trim() === ""
        ? null
        : Math.max(parseEuroToCents(formData.get("materialCost")), 0),
    laborHours:
      String(formData.get("laborHours") ?? "").trim() === ""
        ? null
        : Math.max(numberValue(formData, "laborHours", 0), 0),
    notes: text(formData, "notes"),
    isActive: formData.get("isActive") !== "false"
  };
}

export async function createItemTemplateAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const data = templateData(formData);

  if (!data) redirect("/kalkulation?error=template");

  await prisma.itemTemplate.create({
    data: {
      userId: user.id,
      ...data
    }
  });

  revalidatePath("/kalkulation");
  redirect("/kalkulation?saved=template");
}

export async function updateItemTemplateAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const data = templateData(formData);

  if (!id || !data) redirect("/kalkulation?error=template");

  await prisma.itemTemplate.updateMany({
    where: { id, userId: user.id },
    data
  });

  revalidatePath("/kalkulation");
  redirect("/kalkulation?saved=template");
}

export async function deleteItemTemplateAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");

  await prisma.itemTemplate.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/kalkulation");
  redirect("/kalkulation");
}
