import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';

export default async function PartsPage() {
  const [total, overdue, newParts, longCycle] = await Promise.all([
    prisma.part.count(),
    prisma.part.count({ where: { status: 'overdue' } }),
    prisma.part.count({ where: { status: 'new' } }),
    prisma.part.count({ where: { status: 'long' } }),
  ]);

  return (
    <>
      <Topbar
        title="부품 관리"
        subtitle="펌프장 × 설비 × 부품·작업 단위 통합 이력"
      />
      <main className="flex-1 px-4 py-6 lg:px-8">
        <div className="mb-4 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          ★ Part는 RPMS 유지관리의 최소 단위입니다. 총{' '}
          <strong>{total}</strong>건의 부품·작업이 관리됩니다.
        </div>
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="총 부품" value={total} tone="default" />
          <Stat label="★ 누적지연" value={overdue} tone="red" />
          <Stat label="◆ 신설설비" value={newParts} tone="sky" />
          <Stat label="장기주기" value={longCycle} tone="slate" />
        </section>
        <p className="mt-6 text-sm text-ink-muted">
          Phase 4에서 부품 카드 · 타임라인 · 필터 UI가 구축됩니다.
        </p>
      </main>
    </>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'default' | 'red' | 'sky' | 'slate';
}) {
  const ring = {
    default: 'border-line',
    red: 'border-red-200 ring-1 ring-red-100',
    sky: 'border-sky-200 ring-1 ring-sky-100',
    slate: 'border-slate-200',
  }[tone];
  return (
    <div className={`rounded-lg border bg-white p-4 ${ring}`}>
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-ink">
        {value.toLocaleString('ko-KR')}
        <span className="ml-1 text-sm font-normal text-ink-muted">건</span>
      </p>
    </div>
  );
}
