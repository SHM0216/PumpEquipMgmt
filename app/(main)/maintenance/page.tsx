import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';

export default async function MaintenancePage() {
  const count = await prisma.maintenance.count();
  return (
    <>
      <Topbar title="유지보수 이력" subtitle="공사 · 용역 · 물품 계약 이력" />
      <main className="flex-1 px-4 py-6 lg:px-8">
        <p className="text-sm text-ink-muted">
          유지보수 계약 <strong className="text-ink">{count}</strong>건 — Phase 5에서 표·필터·등록 폼이 구축됩니다.
        </p>
      </main>
    </>
  );
}
