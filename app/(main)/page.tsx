import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';

export default async function DashboardPage() {
  const [facilityCount, equipmentCount, partCount, maintenanceCount] =
    await Promise.all([
      prisma.facility.count(),
      prisma.equipment.count(),
      prisma.part.count(),
      prisma.maintenance.count(),
    ]);

  return (
    <>
      <Topbar
        title="대시보드"
        subtitle="시설물 · 부품 · 유지보수 현황 요약"
      />
      <main className="flex-1 px-4 py-6 lg:px-8">
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="시설물" value={facilityCount} suffix="개소" />
          <StatCard label="설비" value={equipmentCount} suffix="대" />
          <StatCard
            label="부품"
            value={partCount}
            suffix="건"
            highlight
          />
          <StatCard label="유지보수 이력" value={maintenanceCount} suffix="건" />
        </section>

        <p className="mt-8 text-sm text-ink-muted">
          좌측 메뉴에서 각 업무를 선택해주세요.
        </p>
      </main>
    </>
  );
}

function StatCard({
  label,
  value,
  suffix,
  highlight,
}: {
  label: string;
  value: number;
  suffix: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border bg-white p-4 ${
        highlight ? 'border-sky-200 ring-1 ring-sky-100' : 'border-line'
      }`}
    >
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-ink">
        {value.toLocaleString('ko-KR')}
        <span className="ml-1 text-sm font-normal text-ink-muted">
          {suffix}
        </span>
      </p>
    </div>
  );
}
