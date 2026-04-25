import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';

export default async function FacilityPage() {
  const count = await prisma.facility.count();
  return (
    <>
      <Topbar title="시설물 현황" subtitle="펌프장 · 유수지 · 공통설비" />
      <main className="flex-1 px-4 py-6 lg:px-8">
        <p className="text-sm text-ink-muted">
          등록된 시설물 <strong className="text-ink">{count}</strong>건 — Phase 3에서 상세 페이지가 구축됩니다.
        </p>
      </main>
    </>
  );
}
