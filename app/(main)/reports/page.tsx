import { Topbar } from '@/components/layout/Topbar';

export default function ReportsPage() {
  return (
    <>
      <Topbar title="통계 보고서" subtitle="연도별 집행액 · 설비별 빈도" />
      <main className="flex-1 px-4 py-6 lg:px-8">
        <p className="text-sm text-ink-muted">
          Phase 7에서 차트(Recharts) 기반 보고서가 구축됩니다.
        </p>
      </main>
    </>
  );
}
