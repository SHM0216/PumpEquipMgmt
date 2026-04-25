import { prisma } from '@/lib/db';

export default async function HomePage() {
  const [facilityCount, equipmentCount, partCount, maintenanceCount] =
    await Promise.all([
      prisma.facility.count(),
      prisma.equipment.count(),
      prisma.part.count(),
      prisma.maintenance.count(),
    ]);

  return (
    <main className="container mx-auto py-12">
      <header className="mb-10">
        <p className="text-sm text-muted-foreground">RPMS · Phase 1</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          빗물펌프장 시설물 관리 시스템
        </h1>
        <p className="mt-2 text-muted-foreground">
          대구광역시 달서구 배수운영과 · 시드 데이터 적재 확인
        </p>
      </header>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="시설물(Facility)" value={facilityCount} />
        <StatCard label="설비(Equipment)" value={equipmentCount} />
        <StatCard label="부품(Part)" value={partCount} highlight />
        <StatCard label="유지보수(Maintenance)" value={maintenanceCount} />
      </section>

      <p className="mt-10 text-sm text-muted-foreground">
        다음 단계: <code className="rounded bg-muted px-1.5 py-0.5">phase2_layout.md</code>{' '}
        — 사이드바·라우팅 구성
      </p>
    </main>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        highlight ? 'border-sky-200 bg-sky-50' : 'bg-card'
      }`}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">
        {value.toLocaleString('ko-KR')}
      </p>
    </div>
  );
}
