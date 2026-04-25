import { addMonths, differenceInDays } from 'date-fns';
import type { Equipment, PmMaster, Part } from '@prisma/client';

export type AlertLevel = 'critical' | 'warning' | 'normal' | 'info';

export type EquipmentAlert = {
  equipmentId: string;
  equipmentName: string;
  facilityId: string;
  facilityName: string | null;
  category: string;
  subcategory: string;
  cycleMonths: number;
  pmItem: string | null;
  lastMaintDate: string | null; // ISO
  dueDate: string; // ISO
  daysUntilDue: number;
  level: AlertLevel;
  levelLabel: string;
};

export type PartAlert = {
  partId: string;
  partName: string;
  facilityCode: string;
  facilityLabel: string;
  equipmentGroup: string;
  cycle: string | null;
  nextTime: string | null;
  nextYear: number | null;
  status: string;
  statusLabel: string | null;
  level: AlertLevel;
  levelLabel: string;
};

const HORIZON_DAYS = 180;

export function computeEquipmentAlerts(
  equipment: Array<
    Equipment & { facility?: { name: string } | null }
  >,
  pmMaster: PmMaster[],
): EquipmentAlert[] {
  const now = new Date();
  const alerts: EquipmentAlert[] = [];

  for (const e of equipment) {
    if (!e.lastMaintDate) continue;
    const pm = pmMaster.find(
      (p) => p.category === e.category && p.subcategory === e.subcategory,
    );
    if (!pm) continue;

    const dueDate = addMonths(new Date(e.lastMaintDate), pm.cycleMonths);
    const days = differenceInDays(dueDate, now);
    if (days > HORIZON_DAYS) continue;

    let level: AlertLevel;
    let levelLabel: string;
    if (days < 0) {
      level = 'critical';
      levelLabel = `${-days}일 경과`;
    } else if (days <= 30) {
      level = 'critical';
      levelLabel = `D-${days}`;
    } else if (days <= 90) {
      level = 'warning';
      levelLabel = `D-${days}`;
    } else {
      level = 'normal';
      levelLabel = `D-${days}`;
    }

    alerts.push({
      equipmentId: e.id,
      equipmentName: e.name,
      facilityId: e.facilityId,
      facilityName: e.facility?.name ?? null,
      category: e.category,
      subcategory: e.subcategory,
      cycleMonths: pm.cycleMonths,
      pmItem: pm.item,
      lastMaintDate: e.lastMaintDate.toISOString(),
      dueDate: dueDate.toISOString(),
      daysUntilDue: days,
      level,
      levelLabel,
    });
  }

  return alerts.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
}

/**
 * Part 기반 알림: 누적지연(★) 또는 차기연도가 ±2년 이내인 부품
 */
export function computePartAlerts(parts: Part[]): PartAlert[] {
  const currentYear = new Date().getFullYear();
  const alerts: PartAlert[] = [];

  for (const p of parts) {
    let level: AlertLevel | null = null;
    let levelLabel = '';

    if (p.status === 'overdue') {
      level = 'critical';
      levelLabel = '★ 누적지연';
    } else if (p.nextYear != null) {
      const diff = p.nextYear - currentYear;
      if (diff < 0) {
        level = 'critical';
        levelLabel = `${-diff}년 경과`;
      } else if (diff === 0) {
        level = 'critical';
        levelLabel = '당년도 도래';
      } else if (diff === 1) {
        level = 'warning';
        levelLabel = '익년 도래';
      } else if (diff === 2) {
        level = 'normal';
        levelLabel = '2년 이내';
      }
    } else if (p.status === 'new') {
      level = 'info';
      levelLabel = '◆ 신설';
    }

    if (!level) continue;

    alerts.push({
      partId: p.id,
      partName: p.partName,
      facilityCode: p.facilityCode,
      facilityLabel: p.facilityLabel,
      equipmentGroup: p.equipmentGroup,
      cycle: p.cycle,
      nextTime: p.nextTime,
      nextYear: p.nextYear,
      status: p.status,
      statusLabel: p.statusLabel,
      level,
      levelLabel,
    });
  }

  // 정렬: critical → warning → normal → info, 그리고 nextYear 오름차순
  const order: Record<AlertLevel, number> = {
    critical: 0,
    warning: 1,
    normal: 2,
    info: 3,
  };
  return alerts.sort((a, b) => {
    const lv = order[a.level] - order[b.level];
    if (lv !== 0) return lv;
    return (a.nextYear ?? 9999) - (b.nextYear ?? 9999);
  });
}

export type CombinedAlert =
  | ({ kind: 'equipment' } & EquipmentAlert)
  | ({ kind: 'part' } & PartAlert);

export function getTopAlerts(
  equipmentAlerts: EquipmentAlert[],
  partAlerts: PartAlert[],
  limit = 10,
): CombinedAlert[] {
  const order: Record<AlertLevel, number> = {
    critical: 0,
    warning: 1,
    normal: 2,
    info: 3,
  };
  const all: CombinedAlert[] = [
    ...equipmentAlerts.map((a) => ({ kind: 'equipment' as const, ...a })),
    ...partAlerts.map((a) => ({ kind: 'part' as const, ...a })),
  ];
  return all
    .sort((a, b) => order[a.level] - order[b.level])
    .slice(0, limit);
}
