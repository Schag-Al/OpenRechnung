import { invoiceStatusLabel, quoteStatusLabel, statusTone } from "@/lib/status";

type StatusBadgeProps = {
  status: string;
  type: "quote" | "invoice";
};

export function StatusBadge({ status, type }: StatusBadgeProps) {
  const label = type === "quote" ? quoteStatusLabel(status) : invoiceStatusLabel(status);

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusTone(status)}`}>
      {label}
    </span>
  );
}
