import Link from "next/link";
import { OpenRechnungLogo } from "@/components/openrechnung-logo";
import { registerAction } from "@/server/actions/auth";

type RegisterPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

function errorText(error?: string): string | null {
  if (error === "exists") return "Fuer diese E-Mail gibt es bereits ein Konto.";
  if (error === "invalid") return "Bitte gib eine gueltige E-Mail und ein Passwort mit mindestens 8 Zeichen ein.";
  return null;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const error = errorText(params?.error);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <Link href="/" className="inline-flex">
          <OpenRechnungLogo />
        </Link>
        <h1 className="mt-4 text-3xl font-black text-brand-ink">Kostenlos starten</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Dein lokales MVP-Konto fuer Angebote, Rechnungen und Kunden.
        </p>
        {error ? <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
        <form action={registerAction} className="mt-6 space-y-4">
          <label>
            <span className="form-label">E-Mail</span>
            <input name="email" type="email" required className="form-input" autoComplete="email" />
          </label>
          <label>
            <span className="form-label">Passwort</span>
            <input name="password" type="password" required minLength={8} className="form-input" autoComplete="new-password" />
          </label>
          <button className="primary-button w-full">Account anlegen</button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-600">
          Schon registriert?{" "}
          <Link href="/login" className="font-bold text-brand-clay">
            Einloggen
          </Link>
        </p>
      </div>
    </main>
  );
}
