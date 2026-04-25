import { PART_STATUS } from '@/lib/part-constants';

const VARIANT_BY_STATUS: Record<
  string,
  { className: string }
> = {
  overdue: { className: 'border-red-200 bg-red-50 text-red-800' },
  normal: { className: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  long: { className: 'border-slate-200 bg-slate-50 text-slate-700' },
  new: { className: 'border-amber-200 bg-amber-50 text-amber-800' },
  done: { className: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
};

export function PartStatusBadge({
  status,
  statusLabel,
  className,
}: {
  status: string;
  statusLabel?: string | null;
  className?: string;
}) {
  const meta =
    (PART_STATUS as Record<string, { label: string }>)[status] ??
    PART_STATUS.normal;
  const variant = VARIANT_BY_STATUS[status] ?? VARIANT_BY_STATUS.normal;
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${variant.className} ${className ?? ''}`}
    >
      {statusLabel || meta.label}
    </span>
  );
}
