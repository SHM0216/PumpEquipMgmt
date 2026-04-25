import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import {
  PartsList,
  type PartRow,
} from '@/components/domain/parts/PartsList';
import { PART_STATUS } from '@/lib/part-constants';

export const dynamic = 'force-dynamic';

export default async function PartsPage() {
  const [parts, statusGroups] = await Promise.all([
    prisma.part.findMany({
      orderBy: [
        { facilityLabel: 'asc' },
        { equipmentGroup: 'asc' },
        { partName: 'asc' },
      ],
    }),
    prisma.part.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
  ]);

  const counts: Record<string, number> = {};
  for (const g of statusGroups) counts[g.status] = g._count._all;
  const total = parts.length;

  const rows: PartRow[] = parts.map((p) => ({
    id: p.id,
    facilityCode: p.facilityCode,
    facilityLabel: p.facilityLabel,
    equipmentGroup: p.equipmentGroup,
    partName: p.partName,
    spec: p.spec,
    history: p.history,
    cycle: p.cycle,
    nextTime: p.nextTime,
    nextYear: p.nextYear,
    status: p.status,
    statusLabel: p.statusLabel,
  }));

  return (
    <>
      <Topbar
        title="부품 관리"
        subtitle="펌프장 × 설비 × 부품·작업 — 유지관리의 최소 단위 ★"
      />
      <main className="flex-1 space-y-5 px-4 py-6 lg:px-8">
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <KpiCard label="전체" value={total} tone="default" />
          <KpiCard
            label={PART_STATUS.overdue.label}
            value={counts.overdue ?? 0}
            tone="red"
          />
          <KpiCard
            label={PART_STATUS.normal.label}
            value={counts.normal ?? 0}
            tone="green"
          />
          <KpiCard
            label={PART_STATUS.long.label}
            value={counts.long ?? 0}
            tone="slate"
          />
          <KpiCard
            label={PART_STATUS.new.label}
            value={counts.new ?? 0}
            tone="amber"
          />
        </section>

        <PartsList rows={rows} />
      </main>
    </>
  );
}

function KpiCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'default' | 'red' | 'green' | 'slate' | 'amber';
}) {
  const ring = {
    default: 'border-line',
    red: 'border-red-200 ring-1 ring-red-100',
    green: 'border-emerald-200',
    slate: 'border-slate-200',
    amber: 'border-amber-200',
  }[tone];
  const valueColor = {
    default: 'text-ink',
    red: 'text-red-700',
    green: 'text-emerald-700',
    slate: 'text-slate-700',
    amber: 'text-amber-700',
  }[tone];
  return (
    <div className={`rounded-lg border bg-white p-4 ${ring}`}>
      <p className="text-xs text-ink-muted">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${valueColor}`}>
        {value.toLocaleString('ko-KR')}
        <span className="ml-1 text-sm font-normal text-ink-muted">건</span>
      </p>
    </div>
  );
}
