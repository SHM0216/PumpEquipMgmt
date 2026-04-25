import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { Badge } from '@/components/ui/badge';
import { PartStatusBadge } from '@/components/domain/parts/PartStatusBadge';
import {
  CategoryBarChart,
  type CategoryAmount,
} from '@/components/dashboard/CategoryBarChart';
import { PartStatusDonut } from '@/components/dashboard/PartStatusDonut';
import {
  computeEquipmentAlerts,
  computePartAlerts,
  getTopAlerts,
} from '@/lib/pm-engine';
import { fmtBillion, fmtDate, fmtKRW, fmtMillion, fmtNumber } from '@/lib/format';
import { CATEGORIES } from '@/lib/constants';

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
    newCount,
    yearlyTotal,
    cumulativeTotal,
    pumpFacilities,
    equipment,
    pmMaster,
    parts,
    categoryGroups,
    statusGroups,
    recentMaintenance,
  ] = await Promise.all([
    prisma.facility.count(),
    prisma.part.count(),
    prisma.part.count({ where: { status: 'overdue' } }),
    prisma.part.count({ where: { status: 'new' } }),
    prisma.maintenance.aggregate({
      where: { year: currentYear },
      _sum: { amount: true },
    }),
    prisma.maintenance.aggregate({ _sum: { amount: true } }),
    prisma.facility.findMany({
      where: { kind: 'pump' },
      include: {
        equipment: { select: { status: true, installDate: true } },
      },
      orderBy: { id: 'asc' },
    }),
    prisma.equipment.findMany({
      include: { facility: { select: { name: true } } },
    }),
    prisma.pmMaster.findMany({ where: { active: true } }),
    prisma.part.findMany(),
    prisma.maintenance.groupBy({
      by: ['category'],
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.part.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
    prisma.maintenance.findMany({
      take: 6,
      orderBy: [{ date: 'desc' }],
      include: {
        facility: { select: { name: true } },
        part: { select: { partName: true } },
      },
    }),
  ]);

  const yearlyAmount = Number(yearlyTotal._sum.amount ?? 0);
  const cumulativeAmount = Number(cumulativeTotal._sum.amount ?? 0);

  // 펌프장별 설비 상태 + 부품 카운트
  const partsByFacility = await prisma.part.groupBy({
    by: ['facilityCode'],
    _count: { _all: true },
  });
  const partCountMap = new Map(
    partsByFacility.map((p) => [p.facilityCode, p._count._all]),
  );

  // 카테고리별 차트 데이터
  const catData: CategoryAmount[] = CATEGORIES.map((c) => {
    const g = categoryGroups.find((x) => x.category === c);
    return {
      category: c,
      amount: Number(g?._sum.amount ?? 0),
      count: g?._count._all ?? 0,
    };
  });

  // 상태별 도넛 데이터
  const statusData = statusGroups.map((g) => ({
    status: g.status,
    count: g._count._all,
  }));

  // 알림
  const eqAlerts = computeEquipmentAlerts(equipment, pmMaster);
  const ptAlerts = computePartAlerts(parts);
  const topAlerts = getTopAlerts(eqAlerts, ptAlerts, 6);

  return (
    <>
      <Topbar
        title="대시보드"
        subtitle={`${currentYear}년 시설·부품·유지보수 현황 요약`}
      />
      <main className="flex-1 space-y-6 px-4 py-6 lg:px-8">
        {/* 6 KPI */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Kpi accent="#1e4a7a" label="관리 시설" value={`${facilityCount}`} suffix="개소" />
          <Kpi
            accent="#2b6cb0"
            label="관리 부품"
            value={fmtNumber(partCount)}
            suffix="건"
            href="/parts"
          />
          <Kpi
            accent="#c53030"
            label="★ 누적지연"
            value={fmtNumber(overdueCount)}
            suffix="건"
            href="/parts?status=overdue"
            tone="danger"
          />
          <Kpi
            accent="#b16a1b"
            label="◆ 신설설비"
            value={fmtNumber(newCount)}
            suffix="건"
            href="/parts?status=new"
            tone="info"
          />
          <Kpi
            accent="#2f855a"
            label={`${currentYear}년 집행액`}
            value={yearlyAmount > 0 ? fmtBillion(yearlyAmount) : '-'}
            suffix={yearlyAmount > 0 ? '억 원' : ''}
            sub={yearlyAmount > 0 ? fmtKRW(yearlyAmount) : undefined}
          />
          <Kpi
            accent="#4a5568"
            label="누적 집행액"
            value={fmtBillion(cumulativeAmount)}
            suffix="억 원"
            sub={`${fmtMillion(cumulativeAmount)} 백만`}
          />
        </section>

        {/* 펌프장별 상태 카드 */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-ink">
            펌프장별 상태
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {pumpFacilities.map((f) => {
              const total = f.equipment.length;
              const good = f.equipment.filter((e) => e.status === 'good').length;
              const warn = f.equipment.filter((e) => e.status === 'warn').length;
              const bad = f.equipment.filter((e) => e.status === 'bad').length;
              const partN = partCountMap.get(f.id) ?? 0;
              const elapsed =
                f.installYear != null
                  ? `${currentYear - f.installYear}년차`
                  : '-';
              return (
                <div
                  key={f.id}
                  className="rounded-lg border border-line bg-white p-4"
                >
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-semibold text-ink">
                      {FACILITY_LABEL[f.id] ?? f.name}
                    </h3>
                    <span className="text-xs text-ink-muted">
                      {f.installYear} · {elapsed}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">
                    설비 {total}대 · 부품 <strong className="text-accent">{partN}</strong>건
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <Badge variant="success">정상 {good}</Badge>
                    <Badge variant="warning">주의 {warn}</Badge>
                    <Badge variant="danger">위험 {bad}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 차트 2열 */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard
            title="대분류별 누적 투입비"
            subtitle="공사·용역·물품 합계 (월성1+2+3)"
          >
            <CategoryBarChart data={catData} />
          </ChartCard>
          <ChartCard
            title="부품 상태 분포"
            subtitle={`총 ${partCount}건`}
          >
            <PartStatusDonut data={statusData} />
          </ChartCard>
        </section>

        {/* 최근 이력 + 알림 Top 6 */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-line bg-white p-5">
            <h3 className="mb-3 flex items-center justify-between text-sm font-semibold text-ink">
              <span>📋 최근 유지보수 이력</span>
              <Link
                href="/maintenance"
                className="text-xs font-normal text-accent hover:underline"
              >
                전체 보기 →
              </Link>
            </h3>
            <ul className="space-y-1.5">
              {recentMaintenance.map((m) => (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center gap-2 rounded border border-line px-3 py-2 text-sm"
                >
                  <span className="text-xs tabular-nums text-ink-muted">
                    {fmtDate(m.date)}
                  </span>
                  <span className="text-xs text-ink-muted">
                    {m.facility.name.replace('월성 제', '월성')}
                  </span>
                  <span className="flex-1 truncate font-medium" title={m.name}>
                    {m.name}
                  </span>
                  <span className="text-xs font-semibold tabular-nums text-accent">
                    {fmtMillion(m.amount)}백만
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-line bg-white p-5">
            <h3 className="mb-3 flex items-center justify-between text-sm font-semibold text-ink">
              <span>🔔 예방정비 알림 Top 6</span>
              <Link
                href="/alerts"
                className="text-xs font-normal text-accent hover:underline"
              >
                전체 보기 →
              </Link>
            </h3>
            <ul className="space-y-1.5">
              {topAlerts.map((a) => (
                <li
                  key={`${a.kind}-${a.kind === 'part' ? a.partId : a.equipmentId}`}
                  className="flex flex-wrap items-center gap-2 rounded border border-line px-3 py-2 text-sm"
                >
                  <Badge
                    variant={
                      a.level === 'critical'
                        ? 'danger'
                        : a.level === 'warning'
                          ? 'warning'
                          : 'success'
                    }
                  >
                    {a.levelLabel}
                  </Badge>
                  <span className="text-xs text-ink-muted">
                    [{a.kind === 'part' ? '부품' : '설비'}]
                  </span>
                  <span className="flex-1 truncate font-medium">
                    {a.kind === 'part' ? a.partName : a.equipmentName}
                  </span>
                  {a.kind === 'part' && (
                    <PartStatusBadge
                      status={a.status}
                      statusLabel={a.statusLabel}
                    />
                  )}
                </li>
              ))}
              {topAlerts.length === 0 && (
                <p className="py-4 text-center text-sm text-ink-muted">
                  현재 알림이 없습니다.
                </p>
              )}
            </ul>
          </div>
        </section>
      </main>
    </>
  );
}

function Kpi({
  accent,
  label,
  value,
  suffix,
  sub,
  href,
  tone,
}: {
  accent: string;
  label: string;
  value: string;
  suffix?: string;
  sub?: string;
  href?: string;
  tone?: 'danger' | 'info';
}) {
  const valueColor =
    tone === 'danger'
      ? 'text-red-700'
      : tone === 'info'
        ? 'text-amber-700'
        : 'text-ink';
  const inner = (
    <div className="relative overflow-hidden rounded-lg border border-line bg-white p-3.5">
      <span
        className="absolute left-0 top-0 h-full w-1"
        style={{ backgroundColor: accent }}
        aria-hidden
      />
      <p className="text-xs text-ink-muted">{label}</p>
      <p className={`mt-1 flex items-baseline gap-1 text-xl font-bold tabular-nums ${valueColor}`}>
        {value}
        {suffix && (
          <span className="text-xs font-normal text-ink-muted">{suffix}</span>
        )}
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

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-line bg-white p-5">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {subtitle && (
        <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p>
      )}
      <div className="mt-3">{children}</div>
    </div>
  );
}
