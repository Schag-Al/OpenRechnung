import { CopyButton } from "@/components/copy-button";
import { type ReminderStage, reminderStageLabel } from "@/lib/reminders";

type ReminderBoxProps = {
  reminders: Array<{
    stage: ReminderStage;
    text: string;
  }>;
};

export function ReminderBox({ reminders }: ReminderBoxProps) {
  return (
    <section className="rounded-2xl border border-red-200 bg-red-50 p-5">
      <div>
        <h2 className="text-lg font-bold text-red-900">Erinnerungstexte</h2>
        <p className="mt-1 text-sm text-red-800">
          Keine automatische E-Mail: Waehle die passende Stufe, pruefe den Text und kopiere ihn.
        </p>
      </div>
      <div className="mt-4 grid gap-4">
        {reminders.map((reminder) => (
          <div key={reminder.stage} className="rounded-xl border border-red-200 bg-white p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="font-black text-red-950">{reminderStageLabel(reminder.stage)}</p>
              <CopyButton text={reminder.text} />
            </div>
            <textarea
              readOnly
              value={reminder.text}
              className="mt-4 min-h-48 w-full rounded-xl border border-red-100 bg-red-50/40 p-4 text-sm leading-6 text-slate-800"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
