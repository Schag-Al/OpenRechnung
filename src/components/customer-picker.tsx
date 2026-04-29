"use client";

import { useMemo, useState } from "react";

export type CustomerPickerOption = {
  id: string;
  name: string;
  contactPerson?: string | null;
  street?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
  email?: string | null;
  phone?: string | null;
  vatId?: string | null;
};

type CustomerPickerProps = {
  customers: CustomerPickerOption[];
  initialCustomerId?: string;
};

function customerSearchText(customer: CustomerPickerOption): string {
  return [
    customer.name,
    customer.contactPerson,
    customer.street,
    customer.postalCode,
    customer.city,
    customer.email,
    customer.phone,
    customer.vatId
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function customerSubtitle(customer: CustomerPickerOption): string {
  return [
    customer.contactPerson,
    [customer.street, customer.postalCode, customer.city].filter(Boolean).join(", "),
    customer.email
  ]
    .filter(Boolean)
    .join(" - ");
}

export function CustomerPicker({ customers, initialCustomerId }: CustomerPickerProps) {
  const initialId = initialCustomerId ?? customers[0]?.id ?? "";
  const [mode, setMode] = useState<"existing" | "manual">(customers.length > 0 ? "existing" : "manual");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(initialId);

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return customers;
    return customers.filter((customer) => customerSearchText(customer).includes(normalizedQuery));
  }, [customers, query]);

  const selectedCustomer = customers.find((customer) => customer.id === selectedId);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="form-label mb-0">Kunde</p>
          <p className="mt-1 text-sm text-slate-600">Bestehenden Kunden suchen oder direkt einen neuen Kunden erfassen.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-brand-sand p-1 text-sm font-bold">
          <button
            type="button"
            onClick={() => setMode("existing")}
            disabled={customers.length === 0}
            className={`rounded-lg px-3 py-2 transition ${
              mode === "existing" ? "bg-white text-brand-ink shadow-sm" : "text-slate-600 hover:text-brand-ink disabled:cursor-not-allowed disabled:opacity-50"
            }`}
          >
            Suchen
          </button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={`rounded-lg px-3 py-2 transition ${mode === "manual" ? "bg-white text-brand-ink shadow-sm" : "text-slate-600 hover:text-brand-ink"}`}
          >
            Manuell
          </button>
        </div>
      </div>

      <input type="hidden" name="customerMode" value={mode} />

      {mode === "existing" ? (
        <div className="mt-4 space-y-3">
          <input type="hidden" name="customerId" value={selectedId} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="form-input"
            placeholder="Kunden suchen: Name, Ansprechpartner, Ort, E-Mail, UID ..."
          />
          {selectedCustomer ? (
            <div className="rounded-xl border border-brand-clay/20 bg-brand-sand/70 p-3 text-sm">
              <p className="font-black text-brand-ink">Ausgewaehlt: {selectedCustomer.name}</p>
              {customerSubtitle(selectedCustomer) ? <p className="mt-1 text-slate-600">{customerSubtitle(selectedCustomer)}</p> : null}
            </div>
          ) : null}
          <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white">
            {filteredCustomers.length === 0 ? (
              <div className="p-4 text-sm text-slate-600">
                Kein Kunde gefunden. Du kannst oben auf <strong>Manuell</strong> wechseln und ihn direkt anlegen.
              </div>
            ) : (
              filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => setSelectedId(customer.id)}
                  className={`block w-full border-b border-slate-100 p-3 text-left text-sm last:border-b-0 hover:bg-brand-sand ${
                    selectedId === customer.id ? "bg-brand-sand text-brand-ink" : "bg-white text-slate-700"
                  }`}
                >
                  <span className="block font-black">{customer.name}</span>
                  {customerSubtitle(customer) ? <span className="mt-1 block text-xs text-slate-500">{customerSubtitle(customer)}</span> : null}
                </button>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label>
            <span className="form-label">Firma oder Name</span>
            <input name="customerName" className="form-input" required placeholder="z. B. Familie Huber oder Muster GmbH" />
          </label>
          <label>
            <span className="form-label">Ansprechpartner optional</span>
            <input name="customerContactPerson" className="form-input" />
          </label>
          <label>
            <span className="form-label">Strasse</span>
            <input name="customerStreet" className="form-input" />
          </label>
          <div className="grid gap-4 sm:grid-cols-[0.7fr_1.3fr]">
            <label>
              <span className="form-label">PLZ</span>
              <input name="customerPostalCode" className="form-input" />
            </label>
            <label>
              <span className="form-label">Ort</span>
              <input name="customerCity" className="form-input" />
            </label>
          </div>
          <label>
            <span className="form-label">Land</span>
            <input name="customerCountry" defaultValue="Oesterreich" className="form-input" />
          </label>
          <label>
            <span className="form-label">E-Mail optional</span>
            <input name="customerEmail" type="email" className="form-input" />
          </label>
          <label>
            <span className="form-label">Telefon optional</span>
            <input name="customerPhone" className="form-input" />
          </label>
          <label>
            <span className="form-label">UID / USt-ID optional</span>
            <input name="customerVatId" className="form-input" placeholder="z. B. ATU12345678" />
            <span className="mt-1 block text-xs text-slate-500">Nur grobe Plausibilitaetspruefung.</span>
          </label>
          <label className="md:col-span-2">
            <span className="form-label">Notizen optional</span>
            <textarea name="customerNotes" className="form-input min-h-20" />
          </label>
        </div>
      )}
    </section>
  );
}
