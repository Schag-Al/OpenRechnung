import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/lib/auth";
import { isTestModeWithoutLogin, TEST_USER_EMAIL } from "@/lib/test-mode";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) return <>{children}</>;

  const demoSession = isTestModeWithoutLogin() && user.email === TEST_USER_EMAIL;

  return (
    <AppShell email={user.email} testMode={demoSession}>
      {children}
    </AppShell>
  );
}
