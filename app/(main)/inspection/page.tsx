import { Topbar } from '@/components/layout/Topbar';

export default function InspectionPage() {
  return (
    <>
      <Topbar title="점검일지" subtitle="현장 점검 기록 · 사진 첨부" />
      <main className="flex-1 px-4 py-6 lg:px-8">
        <p className="text-sm text-ink-muted">
          Phase 8에서 모바일 점검 입력 폼이 구축됩니다.
        </p>
      </main>
    </>
  );
}
