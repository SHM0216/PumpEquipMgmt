# Phase 3: 시설물 현황 + 설비대장

## 전제조건
Phase 1~2 완료.

## Claude Code 프롬프트

---

시설물 현황(`/facility`)과 설비대장(`/equipment`) 페이지를 구현해주세요.

**참고**: `docs/SPEC.md` 3.2, 3.3 섹션.

## 작업 1: 시설물 현황 페이지

### `app/(main)/facility/page.tsx` (Server Component)

**상단 섹션: 펌프장 종합 제원표**
- 5 시설(`ws1, ws2, ws3, myu, common`) 중 **펌프장 3개**만 비교 테이블로 표시
- 행: 설치년월 / 전기용량 / 배수펌프 / 용량 / 전동펌프 / 제진기 / 수문
- 열: 월성1, 월성2, 월성3, 합계

**중단 섹션: 각 시설 상세 카드 (5개)**
- 카드별 정보: 명칭, 경과년수, 설치일, 제원(펌프/유수지/공통 타입별로 다른 필드 표시)
- 등록된 Part 건수 표시
- 누적 유지보수비(sum of Maintenance.amount) 표시
- `kind === 'pump'` vs `reservoir` vs `common` 에 따라 카드 레이아웃 분기

**하단: 공통 제원 정보 패널**
- 위치, 대지면적 40,300㎡, 건축면적 4,503㎡, 유역면적 53.29㎢, 배수용량 14,150㎥/min, 유수지 담수량 1,003천㎥, 설계빈도 10년 등 고정 정보

## 작업 2: 설비대장 페이지

### `app/(main)/equipment/page.tsx`

**필터바**: 시설 / 대분류 / 상태 / 검색
**목록 테이블**: 시설, 대분류 배지, 설비명, 모델·사양, 설치일, 경과년수, 최근 정비, 상태
- 행 클릭 → 설비 카드 Dialog
- `+ 설비 등록` 버튼

### `components/domain/equipment/EquipmentCardDialog.tsx`
3탭:
- **기본정보** — 제원, 설치일, 내용연수, 최근정비
- **정비이력** — 연결된 Maintenance 목록
- **예방정비** — PmMaster 매칭 결과 + 차기 예정일

### `components/domain/equipment/EquipmentEditorDialog.tsx`
CRUD 폼.

## 작업 3: API
- `app/api/facilities/route.ts` — GET 전체 조회
- `app/api/equipment/route.ts` — GET(filter) / POST
- `app/api/equipment/[id]/route.ts` — GET / PATCH / DELETE
- `lib/validators/equipment.ts` — Zod 스키마

## 커밋
```bash
git commit -m "feat(equipment): 시설물 현황 + 설비대장 CRUD 구현"
```
