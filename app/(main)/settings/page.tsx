import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const [
    facilityCount,
    equipmentCount,
    partCount,
    eventCount,
    maintenanceCount,
    pmMasterCount,
    inspectionCount,
  ] = await Promise.all([
    prisma.facility.count(),
    prisma.equipment.count(),
    prisma.part.count(),
    prisma.partEvent.count(),
    prisma.maintenance.count(),
    prisma.pmMaster.count(),
    prisma.inspection.count(),
  ]);

  return (
    <>
      <Topbar
        title="시스템 설정"
        subtitle="환경 정보 · 데이터 현황 · 사용자 관리(향후)"
      />
      <main className="flex-1 space-y-6 px-4 py-6 lg:px-8">
        <Section title="환경 정보">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm md:grid-cols-3">
            <Row label="앱 명칭" value="빗물펌프장 시설물 관리 시스템 (RPMS)" />
            <Row label="버전" value="v0.1.0" />
            <Row label="운영기관" value="대구광역시 달서구 도시관리본부 배수운영과" />
            <Row label="DB" value="SQLite (개발) · PostgreSQL (운영 권장)" />
            <Row label="프레임워크" value="Next.js 15 + Prisma 6" />
            <Row label="시드" value="seed/*.json (6종)" />
          </dl>
        </Section>

        <Section title="데이터 현황">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
            <Stat label="시설물" value={facilityCount} />
            <Stat label="설비" value={equipmentCount} />
            <Stat label="부품" value={partCount} highlight />
            <Stat label="타임라인" value={eventCount} />
            <Stat label="유지보수" value={maintenanceCount} />
            <Stat label="주기 마스터" value={pmMasterCount} />
            <Stat label="점검일지" value={inspectionCount} />
          </div>
        </Section>

        <Section
          title="사용자·권한"
          subtitle="Phase 9 — NextAuth + RBAC (ADMIN/MANAGER/VIEWER/FIELD)"
        >
          <div className="rounded-lg border border-dashed border-line bg-muted/30 p-5 text-sm text-ink-muted">
            <p className="font-semibold text-ink">미구현 (Phase 9 예정)</p>
            <ul className="mt-2 space-y-0.5 text-xs">
              <li>• 인증: NextAuth v5 + Credentials Provider</li>
              <li>• 역할별 권한: ADMIN / MANAGER / VIEWER / FIELD</li>
              <li>• 감사 로그(AuditLog) 자동 기록</li>
              <li>• 정부 SSO 연동 (선택)</li>
            </ul>
          </div>
        </Section>

        <Section title="배포">
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="secondary">Docker</Badge>
            <Badge variant="secondary">PostgreSQL 16</Badge>
            <Badge variant="secondary">백업 cron (3시)</Badge>
            <Badge variant="outline">docs/DEPLOY.md 참고</Badge>
          </div>
        </Section>
      </main>
    </>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-line bg-white p-5">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      {subtitle && (
        <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p>
      )}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-md border border-line bg-muted/20 px-3 py-2">
      <p className="text-[11px] text-ink-muted">{label}</p>
      <p
        className={`mt-0.5 text-lg font-bold tabular-nums ${
          highlight ? 'text-accent' : 'text-ink'
        }`}
      >
        {value.toLocaleString('ko-KR')}
      </p>
    </div>
  );
}
