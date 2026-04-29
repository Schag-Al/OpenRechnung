import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { defaultDocumentTexts } from "@/lib/document-texts";
import { prisma } from "@/lib/prisma";
import { taxModes } from "@/lib/tax-modes";
import { saveCompanyAction } from "@/server/actions/company";

type CompanyPageProps = {
  searchParams?: Promise<{ saved?: string; error?: string }>;
};

function errorText(error?: string): string {
  switch (error) {
    case "companyName":
      return "Bitte mindestens den Firmennamen ausfuellen.";
    case "email":
      return "Bitte pruefe das E-Mail-Format.";
    case "iban":
      return "Die IBAN wirkt nicht plausibel. Bitte pruefe Zahlendreher und Leerzeichen.";
    case "vatId":
      return "Die UID/USt-ID wirkt nicht plausibel. Bitte pruefe Laenderkuerzel und Nummer.";
    default:
      return "Bitte pruefe die markierten Angaben.";
  }
}

export default async function CompanyPage({ searchParams }: CompanyPageProps) {
  const params = await searchParams;
  const user = await requireUser();
  const company = await prisma.companyProfile.findUnique({ where: { userId: user.id } });

  return (
    <>
      <PageHeader
        kicker="Grundlage"
        title="Firmendaten"
        description="Diese Angaben erscheinen auf Angeboten, Rechnungen und PDFs. Logo, Farbe und Nummernkreise steuerst du hier zentral."
      />
      {params?.saved ? <p className="mb-4 rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">Firmendaten gespeichert.</p> : null}
      {params?.error ? <p className="mb-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">{errorText(params.error)}</p> : null}
      <form action={saveCompanyAction} encType="multipart/form-data" className="card space-y-6">
        <div>
          <h2 className="text-xl font-black text-brand-ink">Stammdaten</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label>
              <span className="form-label">Firmenname</span>
              <input name="companyName" required defaultValue={company?.companyName ?? ""} className="form-input" />
            </label>
            <label>
              <span className="form-label">Name des Inhabers</span>
              <input name="ownerName" defaultValue={company?.ownerName ?? ""} className="form-input" />
            </label>
            <label>
              <span className="form-label">Strasse</span>
              <input name="street" defaultValue={company?.street ?? ""} className="form-input" />
            </label>
            <div className="grid gap-4 sm:grid-cols-[0.7fr_1.3fr]">
              <label>
                <span className="form-label">PLZ</span>
                <input name="postalCode" defaultValue={company?.postalCode ?? ""} className="form-input" />
              </label>
              <label>
                <span className="form-label">Ort</span>
                <input name="city" defaultValue={company?.city ?? ""} className="form-input" />
              </label>
            </div>
            <label>
              <span className="form-label">Land</span>
              <input name="country" defaultValue={company?.country ?? "Oesterreich"} className="form-input" />
            </label>
            <label>
              <span className="form-label">E-Mail</span>
              <input name="email" type="email" defaultValue={company?.email ?? ""} className="form-input" />
            </label>
            <label>
              <span className="form-label">Telefonnummer</span>
              <input name="phone" defaultValue={company?.phone ?? ""} className="form-input" />
            </label>
            <label>
              <span className="form-label">Website optional</span>
              <input name="website" defaultValue={company?.website ?? ""} className="form-input" />
            </label>
            <label>
              <span className="form-label">UID / USt-ID optional</span>
              <input name="vatId" defaultValue={company?.vatId ?? ""} className="form-input" placeholder="z. B. ATU12345678" />
              <span className="mt-1 block text-xs text-slate-500">Hinweis: Nur grobe Plausibilitaetspruefung, keine amtliche UID-Pruefung.</span>
            </label>
            <label>
              <span className="form-label">Steuernummer optional</span>
              <input name="taxNumber" defaultValue={company?.taxNumber ?? ""} className="form-input" />
            </label>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6">
          <h2 className="text-xl font-black text-brand-ink">Zahlungsdaten und Defaults</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label>
              <span className="form-label">Bankname</span>
              <input name="bankName" defaultValue={company?.bankName ?? ""} className="form-input" />
            </label>
            <label>
              <span className="form-label">IBAN</span>
              <input name="iban" defaultValue={company?.iban ?? ""} className="form-input" placeholder="AT..." />
            </label>
            <label>
              <span className="form-label">BIC optional</span>
              <input name="bic" defaultValue={company?.bic ?? ""} className="form-input" />
            </label>
            <label>
              <span className="form-label">Standard-Zahlungsziel in Tagen</span>
              <input name="defaultPaymentDays" type="number" min="0" defaultValue={company?.defaultPaymentDays ?? 14} className="form-input" />
            </label>
            <label>
              <span className="form-label">Standard-Steuersatz in %</span>
              <input name="defaultTaxRate" type="number" min="0" step="0.01" defaultValue={company?.defaultTaxRate ?? 20} className="form-input" />
            </label>
            <label>
              <span className="form-label">Standard-Steuerfall</span>
              <select name="defaultTaxMode" defaultValue={company?.defaultTaxMode ?? "STANDARD"} className="form-input">
                {taxModes.map((mode) => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6">
          <h2 className="text-xl font-black text-brand-ink">PDF-Branding und Nummern</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Nummern werden je Jahr fortlaufend vergeben. Aendere Praefixe nur bewusst, weil neue Dokumente danach mit dem neuen Praefix starten.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label>
              <span className="form-label">Markenfarbe</span>
              <input name="brandColor" type="color" defaultValue={company?.brandColor ?? "#0f766e"} className="h-12 w-full rounded-xl border border-slate-200 bg-white p-1" />
            </label>
            <label>
              <span className="form-label">Logo optional</span>
              <input name="logo" type="file" accept="image/png,image/jpeg" className="form-input" />
              <span className="mt-1 block text-xs text-slate-500">PNG oder JPG bis ca. 500 KB.</span>
            </label>
            {company?.logoDataUrl ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="form-label">Aktuelles Logo</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={company.logoDataUrl} alt="Aktuelles Firmenlogo" className="h-20 max-w-48 object-contain" />
                <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input type="checkbox" name="removeLogo" value="true" />
                  Logo entfernen
                </label>
              </div>
            ) : null}
            <label>
              <span className="form-label">Angebots-Praefix</span>
              <input name="quotePrefix" defaultValue={company?.quotePrefix ?? "ANG"} className="form-input" maxLength={8} />
            </label>
            <label>
              <span className="form-label">Rechnungs-Praefix</span>
              <input name="invoicePrefix" defaultValue={company?.invoicePrefix ?? "RE"} className="form-input" maxLength={8} />
            </label>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6">
          <h2 className="text-xl font-black text-brand-ink">Standardtexte fuer Angebote und Rechnungen</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Diese Texte werden in neue Dokumente uebernommen und koennen dort vor dem Versand individuell angepasst werden.
            Bereits gesperrte Dokumente behalten ihren gespeicherten Text.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label>
              <span className="form-label">Angebot: Text vor den Positionen</span>
              <textarea
                name="quoteIntroText"
                defaultValue={company?.quoteIntroText ?? defaultDocumentTexts.quoteIntroText}
                className="form-input min-h-28"
              />
            </label>
            <label>
              <span className="form-label">Angebot: Text nach den Positionen</span>
              <textarea
                name="quoteOutroText"
                defaultValue={company?.quoteOutroText ?? defaultDocumentTexts.quoteOutroText}
                className="form-input min-h-28"
              />
            </label>
            <label>
              <span className="form-label">Rechnung: Text vor den Positionen</span>
              <textarea
                name="invoiceIntroText"
                defaultValue={company?.invoiceIntroText ?? defaultDocumentTexts.invoiceIntroText}
                className="form-input min-h-28"
              />
            </label>
            <label>
              <span className="form-label">Rechnung: Text nach den Positionen</span>
              <textarea
                name="invoiceOutroText"
                defaultValue={company?.invoiceOutroText ?? defaultDocumentTexts.invoiceOutroText}
                className="form-input min-h-28"
              />
            </label>
          </div>
        </div>

        <button className="primary-button">Firmendaten speichern</button>
      </form>
    </>
  );
}
