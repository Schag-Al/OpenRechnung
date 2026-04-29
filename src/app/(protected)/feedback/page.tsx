import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { formatDate } from "@/lib/dates";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createFeatureSuggestionAction } from "@/server/actions/feedback";

type FeedbackPageProps = {
  searchParams?: Promise<{ error?: string; saved?: string }>;
};

const areas = [
  "Angebote",
  "Rechnungen",
  "Kunden",
  "PDF",
  "Kalkulation",
  "Dashboard",
  "Mobile Bedienung",
  "Sonstiges"
];

function statusLabel(status: string): string {
  switch (status) {
    case "PLANNED":
      return "Geplant";
    case "DONE":
      return "Umgesetzt";
    default:
      return "Neu";
  }
}

export default async function FeedbackPage({ searchParams }: FeedbackPageProps) {
  const params = await searchParams;
  const user = await requireUser();
  const suggestions = await prisma.featureSuggestion.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20
  });

  return (
    <>
      <PageHeader
        kicker="Feedback"
        title="Funktionsvorschlag einmelden"
        description="Sammle Ideen direkt aus dem Arbeitsalltag. Im MVP werden Vorschlaege lokal gespeichert und noch nicht extern versendet."
      />

      {params?.saved ? <Notice tone="success">Danke, dein Vorschlag wurde gespeichert.</Notice> : null}
      {params?.error === "required" ? <Notice tone="error">Bitte gib einen kurzen Titel und eine Beschreibung ein.</Notice> : null}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="card">
          <h2 className="text-xl font-black text-brand-ink">Neuen Vorschlag erfassen</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Beschreibe kurz, was dir fehlt, wann du es brauchst und wie es dir Zeit sparen wuerde.
          </p>

          <form action={createFeatureSuggestionAction} className="mt-5 space-y-4">
            <label>
              <span className="form-label">Kurz-Titel</span>
              <input name="title" required className="form-input" placeholder="z. B. Wiederkehrende Rechnungen" />
            </label>
            <label>
              <span className="form-label">Bereich</span>
              <select name="area" className="form-input" defaultValue="">
                <option value="">Bitte waehlen</option>
                {areas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="form-label">Beschreibung</span>
              <textarea
                name="description"
                required
                className="form-input min-h-36"
                placeholder="Was soll die Funktion koennen? In welcher Situation wuerde sie dir helfen?"
              />
            </label>
            <button className="primary-button">Vorschlag speichern</button>
          </form>
        </section>

        <section className="card">
          <h2 className="text-xl font-black text-brand-ink">Eingemeldete Vorschlaege</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Diese Liste ist aktuell nur fuer das Testkonto gedacht und wird beim Demo-Reset wieder geleert.
          </p>

          <div className="mt-5 grid gap-3">
            {suggestions.length === 0 ? (
              <div className="rounded-xl bg-brand-sand p-5 text-sm text-slate-600">
                Noch keine Vorschlaege vorhanden. Der erste gute Gedanke darf ruhig unperfekt sein.
              </div>
            ) : (
              suggestions.map((suggestion) => (
                <article key={suggestion.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-black text-brand-ink">{suggestion.title}</p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                        {[suggestion.area, formatDate(suggestion.createdAt)].filter(Boolean).join(" - ")}
                      </p>
                    </div>
                    <span className="rounded-xl bg-brand-sand px-3 py-2 text-xs font-black text-brand-moss">
                      {statusLabel(suggestion.status)}
                    </span>
                  </div>
                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{suggestion.description}</p>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </>
  );
}
