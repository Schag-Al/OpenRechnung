import { redirect } from "next/navigation";
import { activateDemoSession } from "@/lib/auth";
import { isTestModeWithoutLogin } from "@/lib/test-mode";

export async function GET() {
  if (!isTestModeWithoutLogin()) {
    redirect("/login");
  }

  await activateDemoSession();
  redirect("/dashboard");
}
