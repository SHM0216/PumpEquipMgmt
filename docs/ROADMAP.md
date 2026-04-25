# 개발 로드맵

각 Phase는 Claude Code에 순차적으로 프롬프트를 전달하여 진행합니다.  
프롬프트 원문은 [`prompts/`](../prompts/) 폴더 참조.

---

## Phase 1: 프로젝트 초기화 (1~2일)

**목표**: Next.js + TypeScript + Tailwind + Prisma + shadcn/ui 스캐폴드

- [ ] `npx create-next-app@latest rpms --typescript --tailwind --app --src-dir false --eslint`
- [ ] Prisma 설치 및 초기화
- [ ] SQLite DATABASE_URL 설정
- [ ] `prisma/schema.prisma` 적용 (`prisma/schema.prisma` 참조)
- [ ] `npx prisma migrate dev --name init`
- [ ] shadcn/ui 초기화 및 기본 컴포넌트 설치
- [ ] Pretendard 폰트 로드
- [ ] `lib/db.ts`, `lib/constants.ts`, `lib/format.ts` 작성
- [ ] seed 스크립트 실행 (시설 5 + 설비 25 + 부품 48 + 타임라인 + 계약 52건)
- [ ] GitHub 첫 푸시

**산출물**: 실행 가능한 빈 Next.js 앱 + DB 시드 완료  
**프롬프트**: `prompts/phase1_init.md`

---

## Phase 2: 레이아웃 · 네비게이션 (2~3일)

**목표**: 사이드바 + 탑바 + 10개 메뉴 라우팅

- [ ] 루트 레이아웃 (Pretendard, metadata)
- [ ] `components/layout/Sidebar.tsx` — 10개 메뉴 (부품 관리 포함)
- [ ] `components/layout/Topbar.tsx`
- [ ] 각 페이지 폴더 + 기본 `page.tsx`
- [ ] 전역 CSS 토큰 정의
- [ ] 반응형 (모바일 햄버거)

**프롬프트**: `prompts/phase2_layout.md`

---

## Phase 3: 시설물 현황 + 설비대장 (3~5일)

**목표**: Facility 조회 + Equipment CRUD

- [ ] 시설물 현황 페이지 (5 시설 종합표)
- [ ] 설비대장 목록 + 필터
- [ ] 설비 카드 모달 (3탭)
- [ ] CRUD API
- [ ] Zod 검증

**프롬프트**: `prompts/phase3_equipment.md`

---

## Phase 4: 부품 관리 (Part) ★ 핵심 (5~7일)

**목표**: 48개 부품의 펌프장별 × 설비별 × 부품별 관리 뷰

- [ ] `app/parts/page.tsx` — 부품 목록 (그룹핑 뷰)
- [ ] `components/domain/PartTree.tsx` — 펌프장 → 설비 → 부품 트리
- [ ] `components/domain/PartRow.tsx` — 각 부품 행
- [ ] `components/domain/PartCard.tsx` — 부품 카드 모달 (3탭)
- [ ] 상태 필터 프리셋 (★누적지연 / ◆신설 / 당해 도래)
- [ ] `app/parts/timeline/page.tsx` — 2020~2030 타임라인 매트릭스
- [ ] `components/domain/PartTimeline.tsx` — 매트릭스 뷰 (● ◐ ★ ✓ ◆)
- [ ] `app/api/parts/route.ts` + `[id]/route.ts` — CRUD API
- [ ] `lib/part-status.ts` — 상태 계산 유틸

**프롬프트**: `prompts/phase4_parts.md` ★

---

## Phase 5: 유지보수 이력 (3~4일)

**목표**: Maintenance CRUD + Part 연결

- [ ] 유지보수 이력 목록 + 필터 (시설/분류/연도/종류/검색)
- [ ] 집계 (건수/합계/평균)
- [ ] 등록 폼 — **partId 자동 추천 UI** (같은 시설·카테고리 Part 검색)
- [ ] 설비 카드 및 부품 카드에서 Maintenance 연결 이력 조회
- [ ] CRUD API

**프롬프트**: `prompts/phase5_maintenance.md`

---

## Phase 6: 예방정비 엔진 + 알림 (3~4일)

**목표**: PM 스케줄 자동 산출 + 알림 페이지

- [ ] `lib/pm-engine.ts` — Equipment 기반 차기 예정일 계산
- [ ] `lib/part-status.ts` — Part 기반 상태 계산
- [ ] `app/pm/page.tsx` — 임박 PM 스케줄 + 주기 마스터
- [ ] `app/alerts/page.tsx` — 긴급/주의/예정 3그룹
- [ ] **Part 누적지연 17건** 우선 노출
- [ ] 이메일 알림 (선택, Phase 7 이후)

**프롬프트**: `prompts/phase6_pm.md`

---

## Phase 7: 대시보드 + 보고서 (3~4일)

**목표**: KPI 대시보드 + 통계 + CSV 내보내기

- [ ] 대시보드 KPI 6카드
- [ ] 차트 (Recharts): 대분류별 투입비, 부품 상태 도넛, 연도별 추이
- [ ] 보고서 페이지 (시설별/세부별 TOP 10)
- [ ] CSV 내보내기 (설비·부품·유지보수·점검)
- [ ] 최근 이력 타임라인

**프롬프트**: `prompts/phase7_dashboard.md`

---

## Phase 8: 점검일지 + 첨부파일 (3~4일)

**목표**: 점검 기록 + 파일 업로드

- [ ] 점검일지 목록 + 유형 필터
- [ ] 등록 폼 (일일/주간/월간/정밀/수시)
- [ ] 점검 대상: Facility/Equipment/Part 연결
- [ ] 첨부파일 업로드 (도면/사진/보고서)
- [ ] 업로드 보안 (MIME 검증, 용량 제한)

**프롬프트**: `prompts/phase8_inspection.md`

---

## Phase 9: 인증 · 권한 · 감사로그 (4~5일)

**목표**: NextAuth.js + ADMIN/MANAGER/VIEWER/FIELD 권한

- [ ] NextAuth v5 설정 (Credentials 또는 부서 SSO)
- [ ] 역할 기반 접근 제어 (RBAC)
- [ ] 감사 로그 미들웨어 (CREATE/UPDATE/DELETE 전건)
- [ ] 사용자 관리 화면

**프롬프트**: `prompts/phase9_auth.md`

---

## Phase 10: 배포 준비 (2~3일)

**목표**: Docker + 내부망 배포

- [ ] `Dockerfile` 작성 (multi-stage)
- [ ] `docker-compose.yml` (앱 + Postgres + 볼륨)
- [ ] PostgreSQL 전환 마이그레이션
- [ ] 환경변수 분리 (`.env.production`)
- [ ] 백업 스크립트 (`scripts/backup.sh`)
- [ ] `docs/DEPLOY.md` 작성

**프롬프트**: `prompts/phase10_deploy.md`

---

## 총 예상 일정

| Phase | 소요 | 누적 |
|-------|------|------|
| 1. 초기화 | 2일 | 2일 |
| 2. 레이아웃 | 3일 | 5일 |
| 3. 시설·설비 | 5일 | 10일 |
| 4. **부품 관리 ★** | 7일 | 17일 |
| 5. 유지보수 | 4일 | 21일 |
| 6. PM·알림 | 4일 | 25일 |
| 7. 대시보드 | 4일 | 29일 |
| 8. 점검·첨부 | 4일 | 33일 |
| 9. 인증·권한 | 5일 | 38일 |
| 10. 배포 | 3일 | **41일** |

**총 약 6~8주** (1인 개발 기준, Claude Code 활용 시 단축 가능)

---

## 진행 상태 체크리스트

Phase 1 완료 후 이 섹션에 체크 표시하며 진행 상황을 추적합니다.

- [ ] Phase 1: 초기화
- [ ] Phase 2: 레이아웃
- [ ] Phase 3: 시설·설비
- [ ] Phase 4: 부품 관리 ★
- [ ] Phase 5: 유지보수
- [ ] Phase 6: PM·알림
- [ ] Phase 7: 대시보드
- [ ] Phase 8: 점검·첨부
- [ ] Phase 9: 인증·권한
- [ ] Phase 10: 배포
