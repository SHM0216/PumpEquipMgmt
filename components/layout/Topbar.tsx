type TopbarProps = {
  title: string;
  subtitle?: string;
};

export function Topbar({ title, subtitle }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-line bg-white/90 px-4 py-3 backdrop-blur lg:px-8">
      <div className="ml-12 lg:ml-0">
        <h1 className="text-lg font-semibold text-ink lg:text-xl">{title}</h1>
        {subtitle && (
          <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden items-center gap-1 rounded-full border border-line bg-white px-3 py-1 text-xs text-ink-muted sm:inline-flex">
          🏭 월성빗물펌프장
        </span>
        <span className="hidden items-center gap-1 rounded-full border border-line bg-white px-3 py-1 text-xs text-ink-muted md:inline-flex">
          배수운영과
        </span>
      </div>
    </header>
  );
}
