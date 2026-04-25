import { Topbar } from '@/components/layout/Topbar';

export default function PmPage() {
  return (
    <>
      <Topbar title="예방정비" subtitle="주기 기반 차기 점검·교체 일정" />
      <main className="flex-1 px-4 py-6 lg:px-8">
        <p className="text-sm text-ink-muted">
          Phase 6에서 PM 엔진(주기 매칭 + D-day 계산)이 구축됩니다.
        </p>
      </main>
    </>
  );
}
