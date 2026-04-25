import { Topbar } from '@/components/layout/Topbar';

export default function SettingsPage() {
  return (
    <>
      <Topbar title="시스템 설정" subtitle="사용자 · 권한 · 코드 관리" />
      <main className="flex-1 px-4 py-6 lg:px-8">
        <p className="text-sm text-ink-muted">
          Phase 9에서 사용자·권한 관리가 구축됩니다.
        </p>
      </main>
    </>
  );
}
