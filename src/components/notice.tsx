type NoticeProps = {
  tone?: "info" | "success" | "warning" | "error";
  children: React.ReactNode;
};

const tones = {
  info: "border-sky-200 bg-sky-50 text-sky-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  error: "border-red-200 bg-red-50 text-red-800"
};

export function Notice({ tone = "info", children }: NoticeProps) {
  return <div className={`mb-4 rounded-xl border p-3 text-sm font-semibold ${tones[tone]}`}>{children}</div>;
}
