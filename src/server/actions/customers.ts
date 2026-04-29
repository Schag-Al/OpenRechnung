"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPlausibleVatId, isValidEmail } from "@/lib/validation";

function text(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value.length > 0 ? value : null;
}

function customerData(formData: FormData) {
  const name = text(formData, "name");
  if (!name) return null;
  const email = text(formData, "email");
  const vatId = text(formData, "vatId");

  if (!isValidEmail(email)) return "email";
  if (!isPlausibleVatId(vatId)) return "vatId";

  return {
    name,
    contactPerson: text(formData, "contactPerson"),
    street: text(formData, "street"),
    postalCode: text(formData, "postalCode"),
    city: text(formData, "city"),
    country: text(formData, "country") ?? "Oesterreich",
    email,
    phone: text(formData, "phone"),
    vatId,
    notes: text(formData, "notes")
  };
}

export async function createCustomerAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const data = customerData(formData);

  if (!data) redirect("/kunden/neu?error=name");
  if (typeof data === "string") redirect(`/kunden/neu?error=${data}`);

  await prisma.customer.create({
    data: {
      ...data,
      userId: user.id
    }
  });

  revalidatePath("/kunden");
  redirect("/kunden");
}

export async function updateCustomerAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const data = customerData(formData);

  if (!id || !data) redirect("/kunden?error=invalid");
  if (typeof data === "string") redirect(`/kunden/${id}?error=${data}`);

  await prisma.customer.updateMany({
    where: { id, userId: user.id },
    data
  });

  revalidatePath("/kunden");
  redirect("/kunden");
}

export async function deleteCustomerAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/kunden?error=invalid");

  const [quotes, invoices] = await Promise.all([
    prisma.quote.count({ where: { userId: user.id, customerId: id } }),
    prisma.invoice.count({ where: { userId: user.id, customerId: id } })
  ]);

  if (quotes + invoices > 0) {
    redirect("/kunden?error=used");
  }

  await prisma.customer.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/kunden");
  redirect("/kunden");
}
