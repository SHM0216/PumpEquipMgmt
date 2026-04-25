# Phase 4: 부품 관리 (Part / PartEvent) ★ 핵심 기능

이 Phase는 RPMS의 **가장 중요한 기능**입니다. 48개 부품의 펌프장별 × 설비별 × 부품별 유지관리 뷰와 2020~2030 타임라인 매트릭스를 구현합니다.

## 전제조건
- Phase 1~3 완료 (스캐폴드, 시설물·설비 페이지)
- `prisma/schema.prisma` 의 `Part`, `PartEvent` 모델 적용 (`npx prisma migrate dev --name add_parts`)
- `seed/parts.json` (48건) + `seed/parts_timeline.json` (48건) 시드 완료
- 확인: `npx prisma studio` 에서 Part 48건, PartEvent 130건+ 보여야 함

## Claude Code 프롬프트

---

RPMS의 핵심 기능인 **부품 관리(Part)** 와 **부품 타임라인(PartEvent)** 을 구현해주세요.

**반드시 먼저 다음을 읽어주세요**:
- `CLAUDE.md` 의 "핵심 데이터 모델: 3계층 구조" + "부품 상태 코드" 섹션
- `docs/SPEC.md` 의 부품 관리·타임라인 섹션
- `prisma/schema.prisma` 의 `Part`, `PartEvent` 모델
- `seed/parts.json` 샘플 5건

## 작업 1: 공통 상수와 유틸리티

### `lib/part-constants.ts`

```ts
export const PART_STATUS = {
  overdue: { label: '★ 누적지연', color: 'red',    bg: '#fde8e8', fg: '#c53030' },
  normal:  { label: '정상주기',   color: 'green',  bg: '#e6f4ec', fg: '#2f855a' },
  long:    { label: '장기주기',   color: 'blue',   bg: '#e8f0f9', fg: '#1e4a7a' },
  new:     { label: '◆ 신설설비', color: 'orange', bg: '#fef3e2', fg: '#b16a1b' },
  done:    { label: '✓ 완료확인', color: 'green',  bg: '#e6f4ec', fg: '#2f855a' },
} as const;

export type PartStatus = keyof typeof PART_STATUS;

export const PART_EVENT_TYPES = {
  done:    { symbol: '●', label: '시행 완료', color: '#2f855a' },
  planned: { symbol: '◐', label: '시행 예상', color: '#b16a1b' },
  overdue: { symbol: '★', label: '누적 지연', color: '#c53030' },
  new:     { symbol: '◆', label: '신설',      color: '#b16a1b' },
} as const;

export const FACILITY_LABELS = ['월성1', '월성2', '월성3', '대명유수지', '월성공통'] as const;

export const EQUIPMENT_GROUPS = ['펌프', '제진기', '전기', '기계', '통신', '기타'] as const;

export const TIMELINE_YEARS = [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030] as const;
```

### `lib/part-utils.ts`

```ts
import type { Part } from '@prisma/client';
import { PART_STATUS } from './part-constants';

export function getPartStatusBadge(part: Pick<Part, 'status' | 'statusLabel'>) {
  const status = part.status as keyof typeof PART_STATUS;
  const meta = PART_STATUS[status] ?? PART_STATUS.normal;
  return {
    label: part.statusLabel || meta.label,
    bg: meta.bg,
    fg: meta.fg,
  };
}

/**
 * 시행 이력 텍스트 파싱
 * "• 2022: 오버홀 공사 [#42]" → { year: 2022, text: '오버홀 공사', ref: '42' }
 */
export function parseHistoryLines(history: string | null) {
  if (!history) return [];
  return history
    .split(/\n|•/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^(\d{4}):\s*(.+?)(?:\s*\[#(\d+)\])?\s*$/);
      if (!m) return { year: null, text: line, ref: null };
      return { year: Number(m[1]), text: m[2].trim(), ref: m[3] || null };
    });
}

/**
 * 부품의 차기 시기까지 남은 연수 (음수면 경과)
 */
export function getYearsUntilDue(part: Pick<Part, 'nextYear'>): number | null {
  if (!part.nextYear) return null;
  return part.nextYear - new Date().getFullYear();
}
```

## 작업 2: API Route Handlers

### `app/api/parts/route.ts` — 목록·생성

```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const PartCreateSchema = z.object({
  facilityCode: z.string().min(1),
  facilityLabel: z.string().min(1),
  equipmentGroup: z.string().min(1),
  equipmentId: z.string().nullable().optional(),
  partName: z.string().min(1, '부품명을 입력해주세요.'),
  spec: z.string().nullable().optional(),
  history: z.string().nullable().optional(),
  cycle: z.string().nullable().optional(),
  cycleMonths: z.number().int().nullable().optional(),
  nextTime: z.string().nullable().optional(),
  nextYear: z.number().int().nullable().optional(),
  status: z.enum(['overdue', 'normal', 'long', 'new', 'done']),
  statusLabel: z.string().nullable().optional(),
  overdue: z.boolean().optional(),
  isNew: z.boolean().optional(),
  note: z.string().nullable().optional(),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const facilityCode = searchParams.get('facilityCode');
  const equipmentGroup = searchParams.get('equipmentGroup');
  const status = searchParams.get('status');
  const q = searchParams.get('q');

  const parts = await prisma.part.findMany({
    where: {
      ...(facilityCode && facilityCode !== 'all' ? { facilityCode } : {}),
      ...(equipmentGroup && equipmentGroup !== 'all' ? { equipmentGroup } : {}),
      ...(status && status !== 'all' ? { status } : {}),
      ...(q
        ? {
            OR: [
              { partName: { contains: q } },
              { spec: { contains: q } },
              { history: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: [{ facilityLabel: 'asc' }, { equipmentGroup: 'asc' }, { partName: 'asc' }],
  });
  return NextResponse.json({ parts });
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = PartCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const created = await prisma.part.create({ data: parsed.data });
  return NextResponse.json({ part: created }, { status: 201 });
}
```

### `app/api/parts/[id]/route.ts` — 단건·수정·삭제

```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const part = await prisma.part.findUnique({
    where: { id },
    include: {
      events: { orderBy: { year: 'asc' } },
      maintenance: { orderBy: { date: 'desc' } },
    },
  });
  if (!part) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ part });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const updated = await prisma.part.update({ where: { id }, data: body });
  return NextResponse.json({ part: updated });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.part.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
```

### `app/api/parts/timeline/route.ts` — 타임라인 매트릭스

```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const facilityCode = searchParams.get('facilityCode');
  const equipmentGroup = searchParams.get('equipmentGroup');

  const parts = await prisma.part.findMany({
    where: {
      ...(facilityCode && facilityCode !== 'all' ? { facilityCode } : {}),
      ...(equipmentGroup && equipmentGroup !== 'all' ? { equipmentGroup } : {}),
    },
    include: { events: true },
    orderBy: [{ facilityLabel: 'asc' }, { equipmentGroup: 'asc' }, { partName: 'asc' }],
  });

  // 클라이언트가 다루기 쉬운 형태로 변환
  const rows = parts.map((p) => ({
    id: p.id,
    facilityLabel: p.facilityLabel,
    equipmentGroup: p.equipmentGroup,
    partName: p.partName,
    status: p.status,
    eventsByYear: Object.fromEntries(p.events.map((e) => [String(e.year), e.symbol])),
  }));
  return NextResponse.json({ rows });
}
```

## 작업 3: 페이지

### `app/parts/page.tsx` — 부품 목록 (Server Component)

```tsx
import { prisma } from '@/lib/db';
import { PartsClient } from './parts-client';

export const dynamic = 'force-dynamic';

export default async function PartsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const where = {
    ...(sp.facility && sp.facility !== 'all' ? { facilityCode: sp.facility } : {}),
    ...(sp.group && sp.group !== 'all' ? { equipmentGroup: sp.group } : {}),
    ...(sp.status && sp.status !== 'all' ? { status: sp.status } : {}),
    ...(sp.q
      ? {
          OR: [
            { partName: { contains: sp.q } },
            { spec: { contains: sp.q } },
            { history: { contains: sp.q } },
          ],
        }
      : {}),
  };

  const [parts, allParts] = await Promise.all([
    prisma.part.findMany({
      where,
      orderBy: [{ facilityLabel: 'asc' }, { equipmentGroup: 'asc' }, { partName: 'asc' }],
    }),
    prisma.part.findMany({ select: { status: true } }),
  ]);

  // KPI 집계
  const stats = {
    total: allParts.length,
    overdue: allParts.filter((p) => p.status === 'overdue').length,
    normal: allParts.filter((p) => p.status === 'normal').length,
    long: allParts.filter((p) => p.status === 'long').length,
    new: allParts.filter((p) => p.status === 'new').length,
  };

  return <PartsClient parts={parts} stats={stats} />;
}
```

### `app/parts/parts-client.tsx`

5개 KPI 카드(전체/누적지연/정상/장기/신설), 4개 필터(시설/설비/상태/검색), 테이블, 등록/수정 다이얼로그를 구현합니다. 행 클릭 시 부품 상세 다이얼로그를 엽니다.

상세 다이얼로그에는 다음을 표시:
1. **기본정보**: 시설/설비/부품명/규격/주기/차기시기/상태
2. **시행 이력**: `parseHistoryLines()` 으로 파싱한 시계열
3. **연관 계약**: `part.maintenance` 목록 (자동 매핑된 것)
4. **타임라인**: 2020~2030 이벤트 칸 (PartEvent 기반)

테이블 컬럼:
| 시설 | 설비 | 부품/작업 | 규격·수량 | 시행 이력 | 주기 | 차기시기 | 상태 | 관리 |

### `app/parts/timeline/page.tsx` — 부품 타임라인

```tsx
import { prisma } from '@/lib/db';
import { TIMELINE_YEARS } from '@/lib/part-constants';
import { TimelineMatrix } from './timeline-matrix';

export const dynamic = 'force-dynamic';

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const parts = await prisma.part.findMany({
    where: {
      ...(sp.facility && sp.facility !== 'all' ? { facilityCode: sp.facility } : {}),
      ...(sp.group && sp.group !== 'all' ? { equipmentGroup: sp.group } : {}),
    },
    include: { events: true },
    orderBy: [{ facilityLabel: 'asc' }, { equipmentGroup: 'asc' }, { partName: 'asc' }],
  });

  const rows = parts.map((p) => ({
    id: p.id,
    facilityLabel: p.facilityLabel,
    equipmentGroup: p.equipmentGroup,
    partName: p.partName,
    status: p.status,
    eventsByYear: Object.fromEntries(p.events.map((e) => [String(e.year), e.symbol])),
  }));

  return <TimelineMatrix rows={rows} years={[...TIMELINE_YEARS]} />;
}
```

`timeline-matrix.tsx`는 좌측 3컬럼(시설/설비/부품) + 우측 11컬럼(2020~2030) 가로 스크롤 테이블. 셀에는 심볼별 색상 배경:
- `●` 시행완료 → 녹색 배경 흰글자
- `◐` 시행예상 → 주황 점선 테두리
- `★` 누적지연 → 빨강 배경 흰글자
- `◆` 신설 → 주황 배경

상단에 시설·설비 필터 + 범례 표시.

## 작업 4: 사이드바 메뉴 추가

`components/layout/Sidebar.tsx`에 2개 메뉴 추가:
- `🧩 부품 관리` → `/parts`
- `📈 부품 타임라인` → `/parts/timeline`

## 작업 5: 대시보드 KPI 갱신

`app/page.tsx` 의 KPI 카드 4개 중 두 번째·세 번째를 부품 정보로 바꿉니다:
- ❶ 관리 시설
- ❷ **관리 부품** (총 48점)
- ❸ **★ 누적지연** (17건) — 빨강 강조
- ❹ 당년도 집행액

추가 패널: "**🚨 누적지연 부품 TOP 6**" — 시설별 부품 현황 막대그래프.

## 작업 6: 검증

```bash
npm run dev
```

체크리스트:
- [ ] `/parts` 에 48건 표시되는가
- [ ] 시설 필터로 "월성2"만 필터링되는가 (15건)
- [ ] 상태 "★ 누적지연" 필터로 17건만 보이는가
- [ ] 검색 "그랜드패킹" 입력 시 관련 부품만 보이는가
- [ ] 행 클릭 시 부품 상세 다이얼로그 열리는가
- [ ] 새 부품 등록 후 목록에 즉시 반영되는가
- [ ] `/parts/timeline` 에서 2020~2030 매트릭스 렌더링되는가
- [ ] 대시보드 KPI에 부품 통계가 보이는가
- [ ] 모바일 viewport(375px)에서도 사용 가능한가

## 참고: 새 부품 등록 시

사용자가 새 부품을 등록하면 자동으로 `PartEvent` 도 생성하도록 옵션을 둘 수 있습니다.
- 등록 폼에서 "최근 시행 연도"를 입력하면 → `PartEvent { year, eventType: 'done', symbol: '●' }` 자동 생성
- 차기 시기 연도가 있으면 → `PartEvent { year, eventType: 'planned', symbol: '◐' }` 자동 생성

이 자동화는 Phase 4.5 (선택) 으로 분리하여 구현합니다.

---

다 끝났으면 다음 메시지에 진행 결과를 보고하고, 다음 Phase 5 (유지보수 이력) 진행 여부를 물어봐주세요.
