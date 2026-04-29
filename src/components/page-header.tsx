type PageHeaderProps = {
  kicker?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function PageHeader({ kicker, title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
      <div>
        {kicker ? <p className="text-sm font-bold uppercase tracking-wide text-brand-clay">{kicker}</p> : null}
        <h1 className="mt-1 text-3xl font-black tracking-tight text-brand-ink md:text-4xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      {action ? <div className="flex flex-wrap gap-2">{action}</div> : null}
    </div>
  );
}
