# Phase 6: 예방정비 엔진 + 알림

## 전제조건
Phase 1~5 완료.

## Claude Code 프롬프트

---

예방정비 엔진과 알림 페이지를 구현해주세요.

## 작업 1: 엔진 유틸

### `lib/pm-engine.ts` (Equipment 기반)
```ts
import { addMonths, differenceInDays } from 'date-fns';

export type PmAlertLevel = 'critical' | 'warning' | 'normal' | 'info';

export interface PmAlert {
  equipmentId: string;
  equipmentName: string;
  facilityId: string;
  item: string;
  cycleMonths: number;
  lastMaintDate: Date | null;
  dueDate: Date | null;
  daysUntilDue: number | null;
  level: PmAlertLevel;
  levelLabel: string;
}

export function computeEquipmentAlerts(
  equipment: Array<Equipment>,
  pmMaster: Array<PmMaster>
): PmAlert[] {
  const now = new Date();
  const alerts: PmAlert[] = [];
  for (const e of equipment) {
    if (!e.lastMaintDate) continue;
    const pm = pmMaster.find(p =>
      p.category === e.category && p.subcategory === e.subcategory
    );
    if (!pm) continue;
    const dueDate = addMonths(new Date(e.lastMaintDate), pm.cycleMonths);
    const days = differenceInDays(dueDate, now);
    if (days > 180) continue;
    let level: PmAlertLevel, label: string;
    if (days < 0) { level = 'critical'; label = `${-days}일 경과`; }
    else if (days <= 30) { level = 'critical'; label = `D-${days}`; }
    else if (days <= 90) { level = 'warning'; label = `D-${days}`; }
    else { level = 'normal'; label = `D-${days}`; }
    alerts.push({ /* ... */ });
  }
  return alerts.sort((a, b) => (a.daysUntilDue ?? 0) - (b.daysUntilDue ?? 0));
}
```

### `lib/part-status.ts` 보강 (Phase 4에서 작성)
- `computePartAlerts(parts: Part[]): PartAlert[]` 함수 추가
- `statusCode === '누적지연'` → critical
- `nextDueYear <= 현재연도` → critical
- `nextDueYear === 현재연도 + 1` → warning

## 작업 2: 예방정비 페이지

### `app/(main)/pm/page.tsx`

**상단: Equipment 기반 임박 PM 테이블**
- computeEquipmentAlerts 결과
- 컬럼: 상태뱃지, 설비, 정비항목, 최근수행, 차기예정, 잔여

**중단: Part 기반 임박 테이블** ★
- Part 중 누적지연 17건 + 당해/익년 도래 전부
- 컬럼: 상태, 시설, 설비타입, 부품, 주기, 차기, 상태코드

**하단: 주기 마스터 관리**
- PmMaster 목록 + 인라인 편집 가능
- Admin만 편집 가능 (Phase 9 이후)

## 작업 3: 알림 페이지

### `app/(main)/alerts/page.tsx`

3개 섹션으로 분리:

**🚨 긴급 · 경과**
- Equipment critical alerts
- **Part 누적지연 17건** ← 최상단 표시

**⚠️ 주의 (D-90 이내)**
- Equipment warning alerts
- Part 중 차기 연도가 내년인 것

**📅 예정 (D-180 이내)**
- Equipment normal alerts (180일 이내)
- Part 중 차기 연도가 2년 내

각 알림 행:
- 레벨 뱃지 / 이름 / 정비항목 / 차기일 / 잔여

## 작업 4: 대시보드 알림 위젯 (Phase 7에서 사용)
`lib/pm-engine.ts` 의 `getTopAlerts(limit = 10)` 함수 추가.

## 커밋
```bash
git commit -m "feat(pm): Equipment/Part 기반 예방정비 엔진 + 알림 페이지"
```
