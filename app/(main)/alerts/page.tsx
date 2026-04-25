import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { Badge } from '@/components/ui/badge';
import { PartStatusBadge } from '@/components/domain/parts/PartStatusBadge';
import {
  computeEquipmentAlerts,
  computePartAlerts,
  type AlertLevel,
  type EquipmentAlert,
  type PartAlert,
} from '@/lib/pm-engine';
import { fmtDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

const LEVEL_VARIANT: Record<
  AlertLevel,
  'danger' | 'warning' | 'success' | 'info'
> = {
  critical: 'danger',
  warning: 'warning',
  normal: 'success',
  info: 'info',
};

export default async function AlertsPage() {
  const [equipment, pmMaster, parts] = await Promise.all([
    prisma.equipment.findMany({
      include: { facility: { select: { name: true } } },
    }),
    prisma.pmMaster.findMany({ where: { active: true } }),
    prisma.part.findMany(),
  ]);

  const eqAlerts = computeEquipmentAlerts(equipment, pmMaster);
  const ptAlerts = computePartAlerts(parts);

  // 레벨별 분류
  const eqByLevel = groupByLevel(eqAlerts);
  const ptByLevel = groupByLevel(ptAlerts);

  return (
    <>
      <Topbar
        title="알림 · 리마인더"
        subtitle="긴급 / 주의 / 예정 — Equipment 및 Part 통합 알림 인박스"
      />
      <main className="flex-1 space-y-6 px-4 py-6 lg:px-8">
        {/* 긴급 */}
        <Section
          icon="🚨"
          title="긴급 · 경과"
          subtitle="누적지연 + 당년도 도래 + D-30 이내"
          tone="critical"
          partAlerts={ptByLevel.critical}
          equipmentAlerts={eqByLevel.critical}
        />
        {/* 주의 */}
        <Section
          icon="⚠️"
          title="주의"
          subtitle="익년 도래 + D-90 이내"
          tone="warning"
          partAlerts={ptByLevel.warning}
          equipmentAlerts={eqByLevel.warning}
        />
        {/* 예정 */}
        <Section
          icon="📅"
          title="예정"
          subtitle="2년 이내 + D-180 이내"
          tone="normal"
          partAlerts={ptByLevel.normal}
          equipmentAlerts={eqByLevel.normal}
        />
        {/* 정보 */}
        {(ptByLevel.info.length > 0 || eqByLevel.info.length > 0) && (
          <Section
            icon="ℹ️"
            title="정보"
            subtitle="신설 / 참고"
            tone="info"
            partAlerts={ptByLevel.info}
            equipmentAlerts={eqByLevel.info}
          />
        )}
      </main>
    </>
  );
}

function groupByLevel<T extends { level: AlertLevel }>(arr: T[]) {
  return {
    critical: arr.filter((a) => a.level === 'critical'),
    warning: arr.filter((a) => a.level === 'warning'),
    normal: arr.filter((a) => a.level === 'normal'),
    info: arr.filter((a) => a.level === 'info'),
  };
}

function Section({
  icon,
  title,
  subtitle,
  tone,
  partAlerts,
  equipmentAlerts,
}: {
  icon: string;
  title: string;
  subtitle: string;
  tone: AlertLevel;
  partAlerts: PartAlert[];
  equipmentAlerts: EquipmentAlert[];
}) {
  const total = partAlerts.length + equipmentAlerts.length;
  const ringClass = {
    critical: 'border-red-200 bg-red-50/30',
    warning: 'border-amber-200 bg-amber-50/30',
    normal: 'border-emerald-200 bg-emerald-50/30',
    info: 'border-sky-200 bg-sky-50/30',
  }[tone];

  return (
    <section className={`rounded-lg border p-4 ${ringClass}`}>
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <h2 className="text-base font-semibold text-ink">
            {icon} {title}{' '}
            <span className="ml-1 font-mono text-sm tabular-nums text-ink-muted">
              ({total})
            </span>
          </h2>
          <p className="text-xs text-ink-muted">{subtitle}</p>
        </div>
      </div>

      {total === 0 ? (
        <p className="py-6 text-center text-sm text-ink-muted">
          해당 알림이 없습니다.
        </p>
      ) : (
        <div className="space-y-1.5">
          {partAlerts.map((a) => (
            <div
              key={`p-${a.partId}`}
              className="flex flex-wrap items-center gap-2 rounded border border-line bg-white px-3 py-2 text-sm"
            >
              <Badge variant={LEVEL_VARIANT[a.level]}>{a.levelLabel}</Badge>
              <span className="text-xs text-ink-muted">[부품]</span>
              <span className="text-xs text-ink-muted">{a.facilityLabel}</span>
              <span className="text-xs text-ink-muted">·</span>
              <span className="text-xs text-ink-muted">{a.equipmentGroup}</span>
              <span className="flex-1 truncate font-medium" title={a.partName}>
                {a.partName}
              </span>
              <span className="text-xs text-ink-muted">
                {a.nextTime ?? (a.nextYear ? `${a.nextYear}년` : '-')}
              </span>
              <PartStatusBadge status={a.status} statusLabel={a.statusLabel} />
            </div>
          ))}
          {equipmentAlerts.map((a) => (
            <div
              key={`e-${a.equipmentId}`}
              className="flex flex-wrap items-center gap-2 rounded border border-line bg-white px-3 py-2 text-sm"
            >
              <Badge variant={LEVEL_VARIANT[a.level]}>{a.levelLabel}</Badge>
              <span className="text-xs text-ink-muted">[설비]</span>
              <span className="text-xs text-ink-muted">{a.facilityName}</span>
              <span className="text-xs text-ink-muted">·</span>
              <span className="text-xs text-ink-muted">{a.category}</span>
              <span className="flex-1 truncate font-medium">
                {a.equipmentName}
              </span>
              <span className="text-xs text-ink-muted">{a.pmItem ?? '-'}</span>
              <span className="text-xs tabular-nums text-ink-muted">
                {fmtDate(a.dueDate)}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
