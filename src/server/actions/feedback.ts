"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function text(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value.length > 0 ? value : null;
}

export async function createFeatureSuggestionAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const title = text(formData, "title");
  const description = text(formData, "description");

  if (!title || !description) {
    redirect("/feedback?error=required");
  }

  await prisma.featureSuggestion.create({
    data: {
      userId: user.id,
      title,
      area: text(formData, "area"),
      description
    }
  });

  revalidatePath("/feedback");
  redirect("/feedback?saved=1");
}
