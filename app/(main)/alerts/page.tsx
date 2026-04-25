import { Topbar } from '@/components/layout/Topbar';

export default function AlertsPage() {
  return (
    <>
      <Topbar title="알림 · 리마인더" subtitle="누적지연 · 차기 점검 D-day" />
      <main className="flex-1 px-4 py-6 lg:px-8">
        <p className="text-sm text-ink-muted">
          Phase 7에서 알림 인박스 + SMTP 발송이 구축됩니다.
        </p>
      </main>
    </>
  );
}
