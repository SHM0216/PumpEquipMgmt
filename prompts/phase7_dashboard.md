# Phase 7: 대시보드 + 통계 보고서

## 전제조건
Phase 1~6 완료.

## Claude Code 프롬프트

---

대시보드와 통계 보고서 페이지를 Recharts로 구현해주세요.

## 작업 1: 대시보드 (`/`)

### `app/(main)/page.tsx`

**KPI 6카드** (Server Component에서 DB 조회):
1. 관리 시설 (Facility count)
2. 관리 부품 (Part count)
3. **★ 누적지연** (Part where statusCode = '누적지연') ← 빨강 강조
4. **◆ 신설** (Part where isNew = true) ← 파랑 강조
5. 금년도 집행액 (Maintenance.amount sum where year = 현재)
6. 연 누적 (Maintenance.amount sum)

**섹션 1: 펌프장별 상태 카드 (3개)**
- 월성1/2/3 각각
- 정상/주의/위험 설비 수 + 경과년수 + 관리 부품 수

**섹션 2 (2열 그리드)**
- 좌: **대분류별 투입비 바 차트** (Recharts BarChart)
- 우: **부품 상태 도넛 차트** (Recharts PieChart)

**섹션 3**
- 좌: 최근 유지보수 이력 Top 6
- 우: 예방정비 알림 Top 6 (getTopAlerts 활용)

### `components/dashboard/KpiCard.tsx`
- 좌측 컬러 바 + label + value + sub

### `components/dashboard/CategoryBarChart.tsx` ('use client')
- Recharts BarChart
- 카테고리별 합계 (월성1+2+3 합산)

### `components/dashboard/PartStatusDonut.tsx` ('use client')
- Recharts PieChart (도넛)
- 5개 상태 색상 (정상주기 녹, 누적지연 빨, 신설 파랑, 장기 회색, 완료 에메랄드)

## 작업 2: 통계 보고서 (`/reports`)

### `app/(main)/reports/page.tsx`

1. **연도별 집행 추이** — BarChart (2020~현재)
2. **시설별 투입비 구성** — 표 (건수/금액/비중)
3. **세부구분별 TOP 10** — 표
4. **부품 상태 요약 매트릭스** — 시설(행) × 상태(열) 교차표
5. **CSV 내보내기 버튼** 4개: 설비 / **부품** / 유지보수 / 점검

### CSV 내보내기 — `app/api/export/[kind]/route.ts`

```ts
// /api/export/parts → Parts.csv
export async function GET(req: Request, { params }: { params: { kind: string } }) {
  const kind = params.kind; // parts | equipment | maintenance | inspection
  // DB 조회 → CSV 문자열 생성 → Response 반환
  const csv = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${kind}_${today}.csv"`,
    },
  });
}
```

CSV 컬럼 (parts):
`시설, 설비타입, 부품명, 규격, 시행주기, 차기시기, 상태코드, 지연년수, 이력텍스트, 비고`

## 작업 3: 금액 포맷 유틸 개선
`lib/format.ts` 에 BigInt 지원 추가:
```ts
export function fmtWon(v: bigint | number | null | undefined): string {
  if (v == null) return '-';
  return Number(v).toLocaleString('ko-KR') + ' 원';
}
export function fmtMan(v: bigint | number | null | undefined): string {
  if (v == null) return '-';
  return Math.round(Number(v) / 10000).toLocaleString('ko-KR') + ' 만원';
}
export function fmtBaekMan(v: bigint | number | null | undefined): string {
  if (v == null) return '-';
  return Math.round(Number(v) / 1_000_000).toLocaleString('ko-KR') + ' 백만원';
}
```

## 커밋
```bash
git commit -m "feat(dashboard): KPI 6카드 + Recharts 차트 + CSV 내보내기"
```
