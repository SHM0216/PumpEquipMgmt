import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { fmtBillion, fmtKRW, fmtNumber } from '@/lib/format';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const FACILITY_LABEL: Record<string, string> = {
  ws1: '월성1',
  ws2: '월성2',
  ws3: '월성3',
  'ws-daemyeong': '대명유수지',
  'ws-common': '월성공통',
};

export default async function DashboardPage() {
  const currentYear = new Date().getFullYear();

  const [
    facilityCount,
    partCount,
    overdueCount,
    yearlyTotal,
    overdueByFacility,
    overdueTopParts,
  ] = await Promise.all([
    prisma.facility.count(),
    prisma.part.count(),
    prisma.part.count({ where: { status: 'overdue' } }),
    prisma.maintenance.aggregate({
      where: { year: currentYear },
      _sum: { amount: true },
    }),
    prisma.part.groupBy({
      by: ['facilityCode'],
      where: { status: 'overdue' },
      _count: { _all: true },
    }),
    prisma.part.findMany({
      where: { status: 'overdue' },
      orderBy: { partName: 'asc' },
      take: 6,
      select: {
        id: true,
        facilityLabel: true,
        equipmentGroup: true,
        partName: true,
        nextTime: true,
      },
    }),
  ]);

  const yearlyAmount = Number(yearlyTotal._sum.amount ?? 0);
  const maxOverdue = Math.max(...overdueByFacility.map((g) => g._count._all), 1);

  return (
    <>
      <Topbar
        title="대시보드"
        subtitle={`${currentYear}년 시설·부품·유지보수 현황 요약`}
      />
      <main className="flex-1 space-y-6 px-4 py-6 lg:px-8">
        {/* 4 KPI */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi label="관리 시설" value={`${facilityCount}개소`} />
          <Kpi
            label="관리 부품 ★"
            value={`${fmtNumber(partCount)}건`}
            href="/parts"
            tone="info"
          />
          <Kpi
            label="★ 누적지연"
            value={`${fmtNumber(overdueCount)}건`}
            href="/parts?status=overdue"
            tone="danger"
          />
          <Kpi
            label={`${currentYear}년 집행액`}
            value={
              yearlyAmount > 0 ? `${fmtBillion(yearlyAmount)}억 원` : '-'
            }
            sub={yearlyAmount > 0 ? fmtKRW(yearlyAmount) : undefined}
          />
        </section>

        {/* 시설별 누적지연 막대 + 누적지연 TOP 6 */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-line bg-white p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
              🚨 시설별 누적지연 분포
            </h2>
            {overdueByFacility.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-muted">
                누적지연 부품이 없습니다.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {overdueByFacility
                  .sort((a, b) => b._count._all - a._count._all)
                  .map((g) => (
                    <li key={g.facilityCode} className="flex items-center gap-3">
                      <span className="w-20 shrink-0 text-xs text-ink-muted">
                        {FACILITY_LABEL[g.facilityCode] ?? g.facilityCode}
                      </span>
                      <div className="relative flex-1">
                        <div className="h-5 rounded bg-muted">
                          <div
                            className="h-5 rounded bg-red-500"
                            style={{
                              width: `${(g._count._all / maxOverdue) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                      <span className="w-12 shrink-0 text-right text-sm font-semibold tabular-nums text-red-700">
                        {g._count._all}건
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-line bg-white p-5">
            <h2 className="mb-3 flex items-center justify-between gap-2 text-sm font-semibold text-ink">
              <span>누적지연 부품 TOP 6</span>
              <Link
                href="/parts?status=overdue"
                className="text-xs font-normal text-accent hover:underline"
              >
                전체 보기 →
              </Link>
            </h2>
            {overdueTopParts.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-muted">
                누적지연 부품이 없습니다.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {overdueTopParts.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-2 rounded border border-red-100 bg-red-50/50 px-3 py-2 text-sm"
                  >
                    <span className="text-red-600">★</span>
                    <span className="w-16 shrink-0 text-xs text-ink-muted">
                      {p.facilityLabel}
                    </span>
                    <span className="flex-1 truncate" title={p.partName}>
                      {p.partName}
                    </span>
                    <span className="text-xs text-ink-muted">
                      {p.nextTime ?? '-'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

function Kpi({
  label,
  value,
  sub,
  href,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  href?: string;
  tone?: 'info' | 'danger';
}) {
  const ring =
    tone === 'danger'
      ? 'border-red-200 ring-1 ring-red-100'
      : tone === 'info'
        ? 'border-sky-200 ring-1 ring-sky-100'
        : 'border-line';
  const valueColor =
    tone === 'danger'
      ? 'text-red-700'
      : tone === 'info'
        ? 'text-sky-700'
        : 'text-ink';

  const inner = (
    <div className={`block rounded-lg border bg-white p-4 ${ring}`}>
      <p className="text-xs text-ink-muted">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${valueColor}`}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-[11px] text-ink-muted">{sub}</p>}
    </div>
  );
  return href ? (
    <Link href={href} className="block transition hover:-translate-y-0.5">
      {inner}
    </Link>
  ) : (
    inner
  );
}
