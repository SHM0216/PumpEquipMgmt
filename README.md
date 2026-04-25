# 빗물펌프장 시설물 관리 시스템 (RPMS)

> Rainwater Pump Station Management System  
> 월성빗물펌프장을 시작으로 관내 전 빗물펌프장으로 확대 적용되는 시설물 통합 관리 시스템

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/license-Internal-lightgrey)]()

## 🎯 개요

빗물펌프장의 시설물·설비 전 생애주기(설치 → 점검 → 보수 → 교체)를 단일 시스템에서 통합 관리합니다.  
기존 계약·회계 중심의 엑셀 관리에서 **설비 중심(Equipment-Centric) 관리** 로 전환하여 예방정비를 체계화합니다.

### 핵심 가치

- **설비별 이력 추적** — 펌프 호기 단위까지 유지보수 이력 누적
- **예방정비 자동화** — 교체주기 마스터 기반 차기 정비일 자동 계산·알림
- **점검-보수 연계** — 정밀안전점검 지적사항의 후속 조치 추적
- **예산 근거 데이터** — 설비별 잔여수명·누적투입비 기반 중장기 투자계획

## 🏗️ 기술 스택

| 구분 | 선택 | 근거 |
|------|------|------|
| **프레임워크** | Next.js 15 (App Router) | 풀스택 통합, Server Components, Claude Code 친화 |
| **언어** | TypeScript 5.6 | 타입 안정성, 자동완성 |
| **UI** | Tailwind CSS v4 + shadcn/ui | 관공서 업무용 UX에 적합, 일관된 디자인 토큰 |
| **DB** | SQLite(dev) / PostgreSQL(prod) | 시범운영은 SQLite, 확대 시 Postgres 마이그레이션 |
| **ORM** | Prisma 6 | 타입 안전 쿼리, 스키마 마이그레이션 |
| **인증** | NextAuth.js v5 (2단계) | 1단계는 미적용, 2단계부터 부서 SSO 연동 검토 |
| **차트** | Recharts | React 친화적, 라이선스 부담 없음 |
| **아이콘** | Lucide React | 공공 업무용 톤에 적합 |
| **배포** | Docker + 내부망 서버 | 정보보안 요건상 외부 클라우드 미사용 |

## 🗺️ 프로젝트 구조

```
rpms/
├── app/                    # Next.js App Router 페이지
│   ├── (dashboard)/        # 대시보드 그룹
│   ├── facility/           # 시설물 현황
│   ├── equipment/          # 설비대장
│   ├── maintenance/        # 유지보수 이력
│   ├── pm/                 # 예방정비
│   ├── inspection/         # 점검일지
│   ├── alerts/             # 알림
│   ├── reports/            # 통계·보고서
│   ├── settings/           # 시스템 설정
│   └── api/                # Route Handlers (CRUD API)
├── components/             # 공통 컴포넌트
│   ├── ui/                 # shadcn/ui 기본 컴포넌트
│   └── domain/             # 도메인 컴포넌트 (EquipmentCard 등)
├── lib/                    # 유틸리티
│   ├── db.ts               # Prisma 클라이언트
│   ├── pm-engine.ts        # 예방정비 계산 로직
│   ├── format.ts           # 숫자·날짜 포맷
│   └── constants.ts        # 분류 체계 상수
├── prisma/
│   ├── schema.prisma       # DB 스키마
│   └── seed.ts             # 시드 스크립트
├── seed/                   # 초기 데이터 (JSON)
│   ├── facilities.json
│   ├── equipment.json
│   ├── maintenance.json
│   └── pm_master.json
├── docs/                   # 설계 문서
└── CLAUDE.md               # Claude Code 컨텍스트 파일
```

## 🚀 빠른 시작

### 요구사항
- Node.js 20 LTS 이상
- npm 10 이상
- Git 2.40 이상
- (선택) Docker 24 이상 — 배포 시

### 로컬 개발

```bash
# 1. 저장소 클론
git clone https://github.com/<your-org>/rpms.git
cd rpms

# 2. 의존성 설치
npm install

# 3. 환경변수 설정
cp .env.example .env.local
# .env.local 편집 — DATABASE_URL 등

# 4. DB 초기화 + 시드
npx prisma migrate dev --name init
npx prisma db seed

# 5. 개발 서버
npm run dev
# → http://localhost:3000
```

## 📋 개발 단계

1. **[Phase 1] 프로젝트 초기화** — Next.js + Prisma + shadcn/ui 스캐폴드
2. **[Phase 2] 데이터 모델 구축** — 스키마 확정, 시드 데이터 이관
3. **[Phase 3] 설비대장 CRUD** — 계층 분류, 설비 카드 UI
4. **[Phase 4] 유지보수 이력** — 필터·검색, 설비 연결
5. **[Phase 5] 예방정비 엔진** — 주기 마스터, 차기 예정일 자동 계산
6. **[Phase 6] 대시보드·통계** — KPI 카드, 차트, CSV/Excel 내보내기
7. **[Phase 7] 점검일지·알림** — 일일 점검, 임박 알림
8. **[Phase 8] 인증·권한·감사로그** — 운영 배포 준비

자세한 내용은 [docs/ROADMAP.md](./docs/ROADMAP.md) 참조.

## 🤖 Claude Code로 개발하기

이 저장소는 Claude Code와 함께 개발하도록 설계되었습니다.

1. Claude Code를 저장소 루트에서 실행합니다.
2. Claude가 자동으로 [`CLAUDE.md`](./CLAUDE.md)를 읽어 프로젝트 컨텍스트를 파악합니다.
3. [`prompts/`](./prompts) 폴더의 단계별 프롬프트를 순서대로 실행합니다.

```bash
# Claude Code 설치 후
cd rpms
claude

# 또는 특정 단계 프롬프트를 바로 실행
claude < prompts/phase1_init.md
```

## 📄 문서

- [docs/SPEC.md](./docs/SPEC.md) — 시스템 명세
- [docs/SCHEMA.md](./docs/SCHEMA.md) — 데이터베이스 스키마
- [docs/API.md](./docs/API.md) — API 엔드포인트
- [docs/ROADMAP.md](./docs/ROADMAP.md) — 개발 로드맵
- [docs/DEPLOY.md](./docs/DEPLOY.md) — 배포 가이드

## 🤝 기여

내부 담당자는 feature 브랜치를 생성하여 PR을 올려주세요.
```bash
git checkout -b feature/짧은-기능설명
# ... 개발 ...
git commit -m "feat(equipment): 설비 카드 상세 3탭 구현"
git push origin feature/짧은-기능설명
```

커밋 메시지 규칙: [Conventional Commits](https://www.conventionalcommits.org/ko/)

## 📝 라이선스

내부 업무 시스템 — 별도 라이선스 협의 필요
