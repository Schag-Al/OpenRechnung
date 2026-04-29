import Link from "next/link";
import { OpenRechnungLogo } from "@/components/openrechnung-logo";
import { loginAction } from "@/server/actions/auth";

type LoginPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <Link href="/" className="inline-flex">
          <OpenRechnungLogo />
        </Link>
        <h1 className="mt-4 text-3xl font-black text-brand-ink">Einloggen</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Weiter zu deinen Angeboten und Rechnungen.</p>
        {params?.error ? (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
            E-Mail oder Passwort stimmt nicht.
          </p>
        ) : null}
        <form action={loginAction} className="mt-6 space-y-4">
          <label>
            <span className="form-label">E-Mail</span>
            <input name="email" type="email" required className="form-input" autoComplete="email" />
          </label>
          <label>
            <span className="form-label">Passwort</span>
            <input name="password" type="password" required className="form-input" autoComplete="current-password" />
          </label>
          <button className="primary-button w-full">Einloggen</button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-600">
          Noch kein Konto?{" "}
          <Link href="/register" className="font-bold text-brand-clay">
            Kostenlos registrieren
          </Link>
        </p>
      </div>
    </main>
  );
}
