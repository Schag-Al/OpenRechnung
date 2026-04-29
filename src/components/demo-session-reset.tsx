"use client";

import { useEffect, useState } from "react";

const DEMO_SESSION_KEY = "openrechnung-demo-session-active";

export function DemoSessionReset() {
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(DEMO_SESSION_KEY) === "true") return;

    let cancelled = false;
    setResetting(true);

    async function resetDemo() {
      try {
        const response = await fetch("/api/demo/reset", { method: "POST" });
        if (!response.ok) throw new Error("Demo reset failed");
        sessionStorage.setItem(DEMO_SESSION_KEY, "true");
        if (!cancelled) {
          window.location.replace("/dashboard?demo=reset");
        }
      } catch {
        if (!cancelled) setResetting(false);
      }
    }

    resetDemo();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!resetting) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/70 px-4 backdrop-blur-sm">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-soft">
        <p className="text-sm font-bold uppercase tracking-wide text-brand-clay">Testkonto wird vorbereitet</p>
        <h2 className="mt-3 text-2xl font-black text-brand-ink">Frische Demo-Daten werden geladen</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Alle Aenderungen aus der vorherigen Browser-Sitzung werden geloescht. Danach kannst du das Testkonto sofort bearbeiten.
        </p>
      </div>
    </div>
  );
}
