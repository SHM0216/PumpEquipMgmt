import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import {
  MaintenanceList,
  type MaintenanceRow,
} from '@/components/domain/maintenance/MaintenanceList';

export const dynamic = 'force-dynamic';

export default async function MaintenancePage() {
  const [items, facilities, yearGroups] = await Promise.all([
    prisma.maintenance.findMany({
      include: {
        facility: { select: { id: true, name: true } },
        part: {
          select: {
            id: true,
            partName: true,
            status: true,
            statusLabel: true,
          },
        },
      },
      orderBy: [{ date: 'desc' }, { id: 'asc' }],
    }),
    prisma.facility.findMany({
      select: { id: true, name: true },
      orderBy: { id: 'asc' },
    }),
    prisma.maintenance.groupBy({ by: ['year'] }),
  ]);

  const rows: MaintenanceRow[] = items.map((m) => ({
    id: m.id,
    date: m.date.toISOString(),
    year: m.year,
    facilityId: m.facilityId,
    facility: m.facility,
    category: m.category,
    subcategory: m.subcategory,
    name: m.name,
    vendor: m.vendor,
    amount: Number(m.amount),
    contractType: m.contractType,
    contractNo: m.contractNo,
    partId: m.partId,
    part: m.part,
  }));

  const years = yearGroups
    .map((g) => g.year)
    .sort((a, b) => b - a);

  return (
    <>
      <Topbar
        title="유지보수 이력"
        subtitle="공사·용역·물품 계약 — Part 자동 추천 연결 지원"
      />
      <main className="flex-1 px-4 py-6 lg:px-8">
        <MaintenanceList rows={rows} facilities={facilities} years={years} />
      </main>
    </>
  );
}
