type DocumentWarningListProps = {
  title?: string;
  warnings: string[];
};

export function DocumentWarningList({ title = "Dokumentencheck", warnings }: DocumentWarningListProps) {
  if (warnings.length === 0) {
    return (
      <section className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
        <p className="font-black">{title}</p>
        <p className="mt-1">
          Keine offensichtlichen Pflichtangaben fehlen. Bitte trotzdem fachlich pruefen, bevor du das Dokument versendest.
        </p>
      </section>
    );
  }

  return (
    <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
      <p className="font-black">{title}</p>
      <p className="mt-1">
        Diese Hinweise ersetzen keine Steuerberatung, helfen aber, typische Luecken vor dem Versand zu finden.
      </p>
      <ul className="mt-3 list-inside list-disc space-y-1">
        {warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
    </section>
  );
}
