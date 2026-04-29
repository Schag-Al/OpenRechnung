import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { resetDemoData } from "@/lib/demo-data";
import { isTestModeWithoutLogin } from "@/lib/test-mode";

export const runtime = "nodejs";

export async function POST() {
  if (!isTestModeWithoutLogin()) {
    return new NextResponse("Demo-Reset ist nur im Testmodus verfuegbar.", { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) return new NextResponse("Nicht angemeldet", { status: 401 });

  await resetDemoData(user.id);

  return NextResponse.json({ ok: true });
}
