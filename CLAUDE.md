# CLAUDE.md

Claude Code가 이 저장소에서 작업할 때 항상 먼저 읽는 컨텍스트 문서.

## 프로젝트 개요

**빗물펌프장 시설물 관리 시스템 (RPMS)** — 지방자치단체 배수운영과 내부 업무 시스템.

- 1단계 대상: 월성빗물펌프장 1·2·3 + 대명유수지 + 공통설비 (대구광역시 달서구)
- 2단계 대상: 관내 전 빗물펌프장 확대
- 사용자: 배수운영과 담당자, 현장 관리자, 부서장

**핵심 데이터**
- 시설물 5개 (월성1: 2005, 월성2: 1992, 월성3: 1972 설치 + 대명유수지 + 월성공통)
- 배수펌프 33대 (13 + 12 + 8), 제진기 27대, 수문 40기
- **48개 부품·작업 단위** 유지관리 이력 (펌프장별 × 설비별 × 부품별)
- 2020~2026 유지보수 계약 89건, 약 41억 원 집행
- **누적지연 17건 / 신설 9건 / 완료확인 1건 / 정상 11건 / 장기 10건**

## 핵심 데이터 모델: 3계층 구조 ★

```
Facility (펌프장)
 ├── Equipment (호기 단위, optional)      예: "월성2 전동펌프 4호기"
 └── Part (부품/작업 단위, PRIMARY) ★     예: "전동펌프 그랜드패킹", "154KV 수전설비 애자"
      └── Maintenance (계약 이력)         예: "#42 2022 오버홀 공사"
```

**⚠️ Part가 유지관리의 최소 단위이자 UI 기본 단위입니다.**  
업로드된 엑셀 『월성펌프장_펌프장별_부품_유지보수이력.xlsx』의 "펌프장 × 설비 × 부품·작업" 구조를 반영합니다.

Equipment(호기)는 선택적입니다 — 일부 부품은 호기를 지정하지만, 그랜드패킹·복합계전기처럼 호기 구분 없이 관리하는 부품도 많기 때문입니다.

또한 일부 부품은 특정 펌프장이 아니라 **공통 시설**(154KV 수전설비, UPS 축전지, ALTS 등 — `월성공통`)이나 **부속 시설**(`대명유수지`)에 속하므로, `Part.facilityCode`는 `ws1/ws2/ws3/ws-common/ws-daemyeong` 자유 문자열로 둡니다 (Facility 테이블과 외래키 강제 X).

### 부품 상태 코드 (Part.status) ★

엑셀 분류를 그대로 따릅니다.

| 코드 | 라벨 | 의미 | UI 색상 |
|------|------|------|--------|
| `overdue` | ★ 누적지연 | 교체주기 경과, 즉시 조치 필요 | 빨강 (#c53030) |
| `normal` | 정상주기 | 정상 주기 내 | 녹색 (#2f855a) |
| `long` | 장기주기 | 10년+ 또는 상태기반 점검 | 진청 (#1e4a7a) |
| `new` | ◆ 신설설비 | 최근 신설, 첫 정기 도래 대기 | 주황 (#b16a1b) |
| `done` | ✓ 완료확인 | 최근 교체 완료 (UPS 축전지 등) | 녹색 (#2f855a) |

### 부품 타임라인 이벤트 (PartEvent.eventType / symbol)

| eventType | symbol | 의미 |
|-----------|--------|------|
| `done`    | ●     | 시행 완료 |
| `planned` | ◐     | 시행 예상 (차기 시기) |
| `overdue` | ★     | 누적 지연 |
| `new`     | ◆     | 신설 |

## 기술 스택 (필수 준수)

- **Next.js 15** (App Router, Server Components)
- **TypeScript 5.6** strict 모드
- **Prisma 6** + SQLite(dev) / PostgreSQL(prod)
- **Tailwind CSS v4** + **shadcn/ui**
- **Recharts** (차트), **Lucide React** (아이콘)
- **Zod** (입력 검증), **date-fns** (한국어 로케일)

## 코딩 규칙

### 언어·로케일
- **모든 UI 텍스트는 한국어**. 영어 혼용 지양.
- 날짜: `YYYY-MM-DD`, 금액: `1,234,567 원` 또는 `123백만 원`
- 폰트: Pretendard (fallback: Malgun Gothic)

### 파일 구조
- 페이지: `app/(group)/segment/page.tsx`
- API: `app/api/resource/route.ts` (Route Handlers)
- 도메인 컴포넌트: `components/domain/PartCard.tsx`
- UI 프리미티브: `components/ui/*` (shadcn/ui 추가만)
- 서버 액션: `'use server'` 파일 또는 `actions.ts`

### 컴포넌트 작성
- **Server Components 우선**. `'use client'`는 이벤트·상태 필요시만.
- 페이지는 async Server Component로 DB 직접 조회.
- 복잡한 폼은 Server Action + `useFormState` 조합.

### DB 액세스
- `import { prisma } from '@/lib/db'` 단일 인스턴스.
- 금액은 Prisma `BigInt` — 프론트 전달 시 `Number()` 또는 직렬화 헬퍼 경유.
- 트랜잭션 필요 시 `prisma.$transaction([...])`.

### 에러·검증
- API는 Zod 스키마로 body 검증 → 실패 시 400 JSON.
- 사용자 에러 메시지는 한국어: "필수 항목을 입력해주세요."
- 서버 에러는 `console.error` + 500 JSON.

## 도메인 상수 (변경 금지 without approval)

### 설비 6대분류 (Part.equipmentType, Equipment.category)
`펌프`, `제진기`, `전기`, `기계`, `통신`, `기타`

### 33세부구분 (Equipment.subcategory)
- **펌프**: 펌프 오버홀 / 전동펌프 수선 / 펌프 오일 / 펌프 계측 / 펌프 부속품 / 진공펌프 / 펌프 기초
- **제진기**: 제진기 / 컨베이어(협잡물) / 암롤박스
- **전기**: 수·배전설비 / 보호계전·개폐기 / 조명·환기 / 전력케이블 / 비상발전기 / 컨베이어 전기공사 / 기동반 / 제어반 / 수위계(계측) / 축전지 / 냉방 전기공사 / 교통신호등
- **기계**: 고무보·기계실 / 냉방기 / 크레인 / 수문권양기 / 소방설비
- **통신**: CCTV / 영상정보처리시스템 / 통합감시시스템
- **기타**: 안전점검 용역 / 시설물·건축 보수 / 월성교(교량) / 준설 / 유류 / 기타

`lib/constants.ts` 의 `SUBCATEGORIES`에 정의.

### Part 상태 코드 (Part.statusCode) ★
- **정상주기** — 주기 내 정상 관리 중 (녹색)
- **누적지연** — 주기 경과, 조속 대응 필요 (★ 빨강)
- **신설설비** — 최근 도입, 첫 점검/교체 대기 (◆ 파랑)
- **장기주기** — 10년+ 장주기, 상태기반 관리 (회색)
- **완료확인** — 최근 교체 완료 (✓ 녹색 체크)

### Equipment 상태 코드 (Equipment.status)
- `good` (정상, 녹색) / `warn` (주의, 주황) / `bad` (위험, 빨강)

### 계약 종류 (Maintenance.contractType)
`공사` / `용역` / `물품`

### 펌프장 종류 (Facility.kind)
- `pump` (펌프장: ws1, ws2, ws3)
- `reservoir` (유수지: myu — 대명유수지)
- `common` (공통설비: common — 월성공통)

## 예방정비 로직

### Equipment 기반 (lib/pm-engine.ts)
```
차기 예정일 = Equipment.lastMaintDate + PmMaster.cycleMonths
         (매칭: category + subcategory)
알림:
  경과 또는 D-30 이내 → bad
  D-31 ~ D-90         → warn
  D-91 ~ D-180        → good
  180일 초과          → 표시 안 함
```

### Part 기반 (lib/part-status.ts) ★
Part의 `nextDueYear` / `statusCode` 를 직접 사용.
- `statusCode`가 "누적지연"이면 무조건 알림 대상
- `nextDueYear`가 현재 연도 ± 1년이면 알림 대상
- Part.lastMaintYear + (cycleMonthsMax/12) 로 재계산 가능

## 작업 원칙

1. **기존 파일 구조·네이밍 컨벤션 준수.** 임의로 바꾸지 말고 질문.
2. **DB 스키마 변경 시** `npx prisma migrate dev --name 설명` 마이그레이션 생성.
3. **공공기관 시스템** — UI는 화려함보다 명확성·가독성 우선. 애니메이션 최소화.
4. **접근성(a11y)** — label 필수, aria-label, 키보드 탐색.
5. **모바일 대응** — 현장 점검 입력이 모바일에서 가능해야 함.
6. **커밋 메시지**: Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`).
7. **시드는 seed/*.json 에서 읽기**. 코드 하드코딩 금지.
8. **Part와 Maintenance 연결** — 신규 Maintenance 등록 시 partId 추천 선택 UI 필수.

## 용어

- **오버홀**: 펌프 전체 분해·정비 (3~5년 주기)
- **제진기**: 협잡물(쓰레기·낙엽)을 걸러내는 설비
- **유수지**: 빗물 일시 저류조 (대명유수지)
- **수배전반**: 고압 전력을 받아 저압으로 분배
- **ALTS**: Auto Load Transfer Switch, 자동 부하 절체 개폐기
- **GIPAM**: 보호 복합계전기 (LS산전 제품군, GIPAM-2000FI/3000FI)
- **LBS**: Load Break Switch, 부하개폐기
- **VCS**: Vacuum Circuit Switch, 진공 개폐기
- **UPS**: Uninterruptible Power Supply, 무정전 전원장치
- **그랜드패킹**: 펌프 축 밀봉용 소모품 (1~2년 교체)
- **복합계전기**: 보호계전기 복합 기능, 연 1~2회 점검

## 참고

- Next.js App Router: https://nextjs.org/docs/app
- Prisma: https://www.prisma.io/docs
- shadcn/ui: https://ui.shadcn.com
- Pretendard: https://cactus.tistory.com/306

---
**마지막 업데이트**: Part 모델 추가 (부품·작업 단위 3계층 구조 반영)
