import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';

export default async function EquipmentPage() {
  const count = await prisma.equipment.count();
  return (
    <>
      <Topbar title="설비대장" subtitle="호기 단위 설비 목록" />
      <main className="flex-1 px-4 py-6 lg:px-8">
        <p className="text-sm text-ink-muted">
          등록된 설비 <strong className="text-ink">{count}</strong>대 — Phase 3에서 상세 페이지가 구축됩니다.
        </p>
      </main>
    </>
  );
}
