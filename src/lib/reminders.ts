import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";

export type ReminderStage = "friendly" | "second" | "final";

type ReminderInput = {
  customerName: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  amountCents: number;
  companyName?: string | null;
};

const stageLabels: Record<ReminderStage, string> = {
  friendly: "Freundliche Erinnerung",
  second: "Zweite Erinnerung",
  final: "Letzte Erinnerung vor weiterer Pruefung"
};

export function reminderStageLabel(stage: ReminderStage): string {
  return stageLabels[stage];
}

export function buildReminderText(input: ReminderInput, stage: ReminderStage = "friendly"): string {
  const sender = input.companyName ? `\n\nMit freundlichen Gruessen\n${input.companyName}` : "";
  const base = `Rechnung ${input.invoiceNumber} vom ${formatDate(input.invoiceDate)} ueber ${formatMoney(input.amountCents)}`;

  if (stage === "second") {
    return `Sehr geehrte Damen und Herren,

wir moechten Sie nochmals daran erinnern, dass die ${base} laut unseren Unterlagen noch offen ist. Das Zahlungsziel war der ${formatDate(input.dueDate)}.

Bitte pruefen Sie den Vorgang und veranlassen Sie den Ausgleich des offenen Betrags zeitnah. Falls sich Ihre Zahlung mit dieser Nachricht ueberschnitten hat, betrachten Sie dieses Schreiben bitte als gegenstandslos.

Vielen Dank.${sender}`;
  }

  if (stage === "final") {
    return `Sehr geehrte Damen und Herren,

trotz bisheriger Erinnerung ist die ${base} laut unseren Unterlagen weiterhin offen. Das Zahlungsziel war der ${formatDate(input.dueDate)}.

Bitte gleichen Sie den offenen Betrag kurzfristig aus oder melden Sie sich, falls es Rueckfragen zur Rechnung gibt. Sollte keine Rueckmeldung oder Zahlung erfolgen, behalten wir uns vor, weitere Schritte zu pruefen.

Vielen Dank.${sender}`;
  }

  return `Sehr geehrte Damen und Herren,

laut unseren Unterlagen ist die ${base} noch offen. Das Zahlungsziel war der ${formatDate(input.dueDate)}.

Falls die Zahlung bereits veranlasst wurde, betrachten Sie diese Nachricht bitte als gegenstandslos. Andernfalls bitten wir um Ausgleich des offenen Betrags in den naechsten Tagen.

Vielen Dank.${sender}`;
}
