# 데이터베이스 스키마

실제 스키마 파일: [`prisma/schema.prisma`](../prisma/schema.prisma)

## 핵심 설계 원칙

### 3계층 구조 ★

```
┌─────────────────────────────────────────────────┐
│  Facility (시설물)                               │
│  ├── id: ws1 / ws2 / ws3 / myu / common         │
│  ├── kind: pump / reservoir / common            │
│  └── name, location, 제원...                    │
└─────────────────────────────────────────────────┘
           ↓                    ↓
┌─────────────────┐    ┌──────────────────────────┐
│ Equipment       │    │ Part (유지관리 최소 단위) │
│ (호기 단위,     │    │ - "전동펌프 6호기"        │
│  optional)      │    │ - "그랜드패킹"            │
│ - 월성2 4호기   │ ←→ │ - "154KV 수전설비"        │
│ - 월성1 수배전반│    │ - 48개 부품               │
└─────────────────┘    └──────────────────────────┘
           ↓                    ↓
           └──────→ Maintenance ←──────┘
              (계약 단위 이력, 89건)
```

## 엔터티 상세

### Facility — 시설물
5개 시설 관리: 펌프장 3 + 유수지 1 + 공통 1

| 필드 | 타입 | 설명 |
|------|------|------|
| id | String PK | `ws1`, `ws2`, `ws3`, `myu`, `common` |
| name | String | 월성 제1빗물펌프장 |
| kind | String | `pump` / `reservoir` / `common` |
| installYear | Int? | 2005 |
| pumpCount | Int? | 13 (펌프장만) |
| pumpCapacity | String? | 22,750㎥/min |

### Equipment — 설비 (호기 단위)
필요한 부품만 호기 단위로 추적 (선택적).

| 필드 | 타입 | 설명 |
|------|------|------|
| id | String PK cuid | |
| facilityId | String FK | Facility.id |
| category | String | 펌프/제진기/전기/기계/통신/기타 |
| subcategory | String | 펌프 오버홀, 수·배전설비 등 |
| name | String | 월성2 전동펌프 4호기 |
| status | String | good/warn/bad |
| lastMaintDate | DateTime? | |

### Part — 부품·작업 단위 ★ 핵심
유지관리의 실제 최소 단위. 업로드 엑셀 48건 전체 반영.

| 필드 | 타입 | 설명 |
|------|------|------|
| id | String PK cuid | |
| facilityCode | String | `ws1`/`ws2`/`ws3`/`ws-common`/`ws-daemyeong` (자유 문자열, FK 강제 X) |
| facilityLabel | String | "월성1", "월성2", "월성공통" 등 표시용 |
| equipmentGroup | String | 펌프/제진기/전기/기계/통신/기타 |
| equipmentId | String? FK | Equipment.id (호기 매핑, 선택) |
| partName | String | "전동펌프 6호기", "그랜드패킹" |
| spec | String? | "600㎥/min × 1,750HP" |
| history | String? | 원본 이력 "• 2022: 오버홀 [#42]" (멀티라인) |
| cycle | String? | "3~5년", "연 1회" |
| cycleMonths | Int? | 36 (계산용, 옵션) |
| nextTime | String? | "2027년 (★누적지연)" |
| nextYear | Int? | 2027 (정렬·필터용) |
| **status** | String | **`overdue`/`normal`/`long`/`new`/`done`** ★ |
| statusLabel | String? | 원문 ("정상주기", "★누적지연" 등) |
| overdue | Boolean | ★ 플래그 |
| isNew | Boolean | ◆ 플래그 (신설) |
| note | String? | |

**인덱스**: `[facilityCode]`, `[equipmentGroup]`, `[status]`, `[nextYear]`, `[equipmentId]`

> ⚠️ `facilityCode`를 자유 문자열로 두는 이유: 부품 중에는 특정 펌프장이 아닌 **공통 시설**(154KV 수전설비, UPS 축전지 등 — `ws-common`)이나 **부속 시설**(`ws-daemyeong` 대명유수지)에 속한 것이 있어, Facility 테이블에 정의되지 않은 가상 시설 분류가 필요합니다.

### PartEvent — 부품 연도별 타임라인 이벤트 ★

엑셀 시트 ②『연도별 타임라인 (2020~2030)』의 매트릭스를 행 단위로 풀어서 저장.

| 필드 | 타입 | 설명 |
|------|------|------|
| id | String PK cuid | |
| partId | String FK | Part.id |
| year | Int | 2020~2030 |
| eventType | String | `done`/`planned`/`overdue`/`new` |
| symbol | String | `●`/`◐`/`★`/`◆` (UI 표시용) |
| note | String? | |
| maintenanceId | String? | 연계 계약 ID (선택) |

**UNIQUE**: `[partId, year, eventType]` (한 부품의 같은 연도·같은 종류 중복 방지)
**인덱스**: `[year]`

### Maintenance — 유지보수 계약 이력

| 필드 | 타입 | 설명 |
|------|------|------|
| id | String PK | |
| date | DateTime | 계약일자 |
| year | Int | 2022 (쿼리 성능용 역정규화) |
| facilityId | String FK | |
| equipmentId | String? FK | (선택) |
| **partId** | String? FK | **Part 연결 (선택) ★** |
| category | String | |
| name | String | 계약명 |
| vendor | String? | 계약업체 |
| amount | BigInt | 원(KRW) |
| contractType | String | 공사/용역/물품 |
| serialNo | Int? | 엑셀 # 번호 |

### PmMaster — 예방정비 주기 마스터

| 필드 | 타입 | 설명 |
|------|------|------|
| category | String | 전기 |
| subcategory | String | 수·배전설비 |
| item | String | 154KV 애자청소 |
| cycleMonths | Int | 12 |
| basis | String? | 한전KPS 기별점검 |

**UNIQUE**: `[category, subcategory, item]`

### Inspection — 점검 기록

| 필드 | 타입 | 설명 |
|------|------|------|
| date | DateTime | |
| facilityId / equipmentId? / partId? | FK | |
| inspType | String | 일일/주간/월간/정밀/수시 |
| target | String | 점검 대상 설명 |
| result | String | 정상/지적/위험 |

### Attachment — 첨부파일

| refType | refId | docCategory |
|---------|-------|-------------|
| facility/equipment/part/maintenance/inspection | 해당 id | 도면/사양서/사진/보고서 |

## 시드 데이터 요약 (`seed/*.json`)

| 파일 | 건수 | 비고 |
|------|------|------|
| facilities.json | 5 | ws1/ws2/ws3 + ws-daemyeong + ws-common |
| equipment.json | 25 | 호기·대표 설비 |
| **parts.json** | **48** | **업로드 엑셀 전체** |
| **parts_timeline.json** | **48** | **2020~2030 연도별 이벤트 매트릭스** |
| maintenance.json | 51 | 89건 중 주요 계약 |
| pm_master.json | 15 | 법정·권장 주기 |

### Parts 시드 분포
**펌프장별 (facilityLabel)**
- 월성1: 14건 / 월성2: 15건 / 월성3: 5건 / 대명유수지: 1건 / 월성공통: 13건

**상태별 (status)**
- `overdue` ★ 누적지연 **17건** ← 최우선 관리 대상
- `normal` 정상주기 11건
- `long` 장기주기 10건
- `new` ◆ 신설설비 9건
- `done` ✓ 완료확인 1건 (UPS 축전지 등)

## 마이그레이션 명령

```bash
# 최초 마이그레이션
npx prisma migrate dev --name init

# 스키마 변경 후
npx prisma migrate dev --name add_part_model

# Prisma Client 재생성
npx prisma generate

# 시드 실행
npx prisma db seed

# 시드 포함 완전 초기화
npx prisma migrate reset

# GUI 탐색
npx prisma studio
```

## 쿼리 예시

### 특정 펌프장의 누적지연 부품
```ts
const delayedParts = await prisma.part.findMany({
  where: {
    facilityId: 'ws2',
    statusCode: '누적지연',
  },
  orderBy: { nextDueYear: 'asc' },
});
```

### 부품별 유지보수 이력 조회
```ts
const part = await prisma.part.findUnique({
  where: { id: partId },
  include: {
    maintenance: { orderBy: { date: 'desc' } },
    facility: true,
  },
});
```

### 당해년도 도래 부품
```ts
const thisYear = new Date().getFullYear();
const due = await prisma.part.findMany({
  where: {
    OR: [
      { nextDueYear: { lte: thisYear } },
      { statusCode: '누적지연' },
    ],
  },
});
```
