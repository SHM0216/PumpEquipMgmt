# Phase 5: 유지보수 이력

## 전제조건
Phase 1~4 완료. Part 모델 동작 중.

## Claude Code 프롬프트

---

유지보수 이력 관리 페이지(`/maintenance`)를 구현해주세요. **Part 연결이 핵심**입니다.

**참고**: `docs/SPEC.md` 3.6 섹션.

## 작업 1: 목록 페이지

### `app/(main)/maintenance/page.tsx`

**필터바**: 시설 / 대분류 / 연도 / 계약종류 / 검색 (URL searchParams)
**집계 요약**: 건수 / 합계 / 평균 (필터 적용된 결과 기준)

**테이블 컬럼**:
- 계약일 / 시설 / 대분류 뱃지 / 계약명 / 업체 / 계약종류 / 금액(원) / 연결 Part / [삭제]

- `Maintenance.partId` 가 있으면 Part 이름 작게 표시, 없으면 "-"
- 금액은 BigInt → Number 변환 후 한국어 포맷

## 작업 2: 등록 폼 Dialog

### `components/domain/maintenance/MaintenanceEditorDialog.tsx`

**필드**: 계약일, 계약종류, 시설, 대분류, 세부구분, 금액, 계약명, 업체, 계약번호

**★ Part 자동 추천 UI**:
- 시설 + 대분류가 선택되면, 같은 조건의 Part 목록을 API로 가져와 드롭다운 표시
- 검색 가능한 Combobox (shadcn/ui `Command` 사용)
- "부품 연결 안 함" 옵션도 제공

구현 예:
```tsx
// 'use client'
const [facilityId, setFacility] = useState('ws1');
const [category, setCategory] = useState('펌프');
const { data: candidates } = useSWR(
  `/api/parts?facilityId=${facilityId}&equipmentType=${category}`,
  fetcher
);
// 드롭다운에 candidates 표시 (이름 + 규격 + 상태 배지)
```

## 작업 3: API

### `app/api/maintenance/route.ts`
- `GET`: 필터 쿼리 지원 (`facilityId`, `category`, `year`, `contractType`, `q`)
  - 반환 시 amount는 `Number()` 로 변환하여 JSON 직렬화
- `POST`: Zod 검증, `year` 자동 계산

### `app/api/maintenance/[id]/route.ts`
- `GET`, `PATCH`, `DELETE`

### `lib/validators/maintenance.ts`
```ts
export const maintenanceInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  facilityId: z.string().min(1),
  equipmentId: z.string().optional().nullable(),
  partId: z.string().optional().nullable(),
  category: z.enum(CATEGORIES),
  subcategory: z.string().min(1),
  name: z.string().min(1),
  vendor: z.string().optional().nullable(),
  amount: z.number().nonnegative(),
  contractType: z.enum(['공사', '용역', '물품']),
  contractNo: z.string().optional().nullable(),
});
```

## 작업 4: Part 카드에서 역방향 조회

`PartCardDialog` 의 "이력" 탭에서:
- `historyText` 파싱된 이력 (원본 엑셀)
- **+ 연결된 Maintenance 목록** (partId = this.id 인 것들)

두 가지를 시간순으로 병합 표시.

## 커밋
```bash
git commit -m "feat(maintenance): 유지보수 이력 CRUD + Part 자동 추천 연결"
```
