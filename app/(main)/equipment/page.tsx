import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import {
  EquipmentList,
  type EquipmentRow,
} from '@/components/domain/equipment/EquipmentList';

export const dynamic = 'force-dynamic';

export default async function EquipmentPage() {
  const [equipment, facilities] = await Promise.all([
    prisma.equipment.findMany({
      include: {
        facility: { select: { id: true, name: true } },
        _count: { select: { parts: true, maintenance: true } },
      },
      orderBy: [{ facilityId: 'asc' }, { category: 'asc' }, { name: 'asc' }],
    }),
    prisma.facility.findMany({
      select: { id: true, name: true },
      orderBy: { id: 'asc' },
    }),
  ]);

  // ISO 직렬화 — Date를 string으로 변환해 클라이언트 컴포넌트에 전달
  const rows: EquipmentRow[] = equipment.map((e) => ({
    id: e.id,
    name: e.name,
    facilityId: e.facilityId,
    facility: e.facility,
    category: e.category,
    subcategory: e.subcategory,
    model: e.model,
    vendor: e.vendor,
    installDate: e.installDate ? e.installDate.toISOString() : null,
    lifeYears: e.lifeYears,
    lastMaintDate: e.lastMaintDate ? e.lastMaintDate.toISOString() : null,
    status: e.status,
    _count: e._count,
  }));

  return (
    <>
      <Topbar
        title="설비대장"
        subtitle="호기 단위 설비 — 클릭하면 상세 카드가 열립니다."
      />
      <main className="flex-1 px-4 py-6 lg:px-8">
        <EquipmentList rows={rows} facilities={facilities} />
      </main>
    </>
  );
}
