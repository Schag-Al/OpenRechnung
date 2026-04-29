type CustomerFormProps = {
  action: (formData: FormData) => Promise<void>;
  customer?: {
    id: string;
    name: string;
    contactPerson: string | null;
    street: string | null;
    postalCode: string | null;
    city: string | null;
    country: string;
    email: string | null;
    phone: string | null;
    vatId: string | null;
    notes: string | null;
  };
};

export function CustomerForm({ action, customer }: CustomerFormProps) {
  return (
    <form action={action} className="card space-y-5">
      {customer ? <input type="hidden" name="id" value={customer.id} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <label>
          <span className="form-label">Firma oder Name</span>
          <input name="name" required defaultValue={customer?.name ?? ""} className="form-input" />
        </label>
        <label>
          <span className="form-label">Ansprechpartner optional</span>
          <input name="contactPerson" defaultValue={customer?.contactPerson ?? ""} className="form-input" />
        </label>
        <label>
          <span className="form-label">Strasse</span>
          <input name="street" defaultValue={customer?.street ?? ""} className="form-input" />
        </label>
        <div className="grid gap-4 sm:grid-cols-[0.7fr_1.3fr]">
          <label>
            <span className="form-label">PLZ</span>
            <input name="postalCode" defaultValue={customer?.postalCode ?? ""} className="form-input" />
          </label>
          <label>
            <span className="form-label">Ort</span>
            <input name="city" defaultValue={customer?.city ?? ""} className="form-input" />
          </label>
        </div>
        <label>
          <span className="form-label">Land</span>
          <input name="country" defaultValue={customer?.country ?? "Oesterreich"} className="form-input" />
        </label>
        <label>
          <span className="form-label">E-Mail</span>
          <input name="email" type="email" defaultValue={customer?.email ?? ""} className="form-input" />
        </label>
        <label>
          <span className="form-label">Telefonnummer</span>
          <input name="phone" defaultValue={customer?.phone ?? ""} className="form-input" />
        </label>
        <label>
          <span className="form-label">UID / USt-ID optional</span>
          <input name="vatId" defaultValue={customer?.vatId ?? ""} className="form-input" />
        </label>
      </div>
      <label className="block">
        <span className="form-label">Notizen</span>
        <textarea name="notes" defaultValue={customer?.notes ?? ""} className="form-input min-h-28" />
      </label>
      <button className="primary-button">{customer ? "Kunde speichern" : "Kunde anlegen"}</button>
    </form>
  );
}
