import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';

export default async function PartsTimelinePage() {
  const count = await prisma.partEvent.count();
  return (
    <>
      <Topbar
        title="부품 타임라인"
        subtitle="시행 완료(●) · 예상(◐) · 누적지연(★) · 신설(◆)"
      />
      <main className="flex-1 px-4 py-6 lg:px-8">
        <p className="text-sm text-ink-muted">
          타임라인 이벤트 <strong className="text-ink">{count}</strong>건 — Phase 4에서 시각화됩니다.
        </p>
      </main>
    </>
  );
}
