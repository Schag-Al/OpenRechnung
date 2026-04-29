import Link from "next/link";
import { logoutAction } from "@/server/actions/auth";
import { DemoSessionReset } from "@/components/demo-session-reset";
import { FeedbackNote } from "@/components/feedback-note";
import { OpenRechnungLogo } from "@/components/openrechnung-logo";
import { SupporterNote } from "@/components/supporter-note";

const navItems = [
  { href: "/dashboard", label: "Dashboard", tourId: "nav-dashboard" },
  { href: "/firma", label: "Firmendaten", tourId: "nav-firma" },
  { href: "/kunden", label: "Kunden", tourId: "nav-kunden" },
  { href: "/angebote", label: "Angebote", tourId: "nav-angebote" },
  { href: "/rechnungen", label: "Rechnungen", tourId: "nav-rechnungen" },
  { href: "/kalkulation", label: "Artikel & Leistungen", tourId: "nav-kalkulation" }
];

type AppShellProps = {
  email: string;
  testMode?: boolean;
  children: React.ReactNode;
};

export function AppShell({ email, testMode = false, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-brand-sand">
      {testMode ? <DemoSessionReset /> : null}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <Link href="/dashboard" className="shrink-0">
            <OpenRechnungLogo />
          </Link>
          <nav className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                data-tour={item.tourId}
                className="whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-brand-sand hover:text-brand-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {testMode ? (
              <div className="flex flex-col items-start gap-1 md:items-end">
                <span className="rounded-xl bg-brand-clay/10 px-3 py-2 text-xs font-bold text-brand-moss ring-1 ring-brand-clay/15">
                  Testmodus ohne Login
                </span>
                <span className="text-xs font-semibold text-slate-500">Reset nach neuer Browser-Sitzung</span>
              </div>
            ) : (
              <>
                <span className="hidden text-xs text-slate-500 md:inline">{email}</span>
                <form action={logoutAction}>
                  <button className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-brand-clay hover:text-brand-ink">
                    Abmelden
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1fr_280px]">
        <section>{children}</section>
        <div className="space-y-4">
          <div data-tour="support-feedback" className="space-y-4">
            <SupporterNote />
            <FeedbackNote />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600 shadow-sm">
            <p className="font-semibold text-brand-ink">Hinweis</p>
            <p className="mt-2">
              Dieses MVP ersetzt keine Steuerberatung und erhebt keinen Anspruch auf vollstaendige Rechtssicherheit.
            </p>
            <div className="mt-4 flex gap-3 text-xs font-bold">
              <Link href="/datenschutz" className="text-brand-clay">
                Datenschutz
              </Link>
              <Link href="/impressum" className="text-brand-clay">
                Impressum
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
