# Phase 2: 레이아웃 · 네비게이션

## 전제조건
Phase 1이 완료되어 있어야 합니다. (Next.js 앱, Prisma 시드, shadcn/ui 설치 완료)

## Claude Code 프롬프트

---

RPMS 메인 레이아웃과 사이드바 네비게이션을 구축해주세요.

**참고 문서**: `CLAUDE.md`, `docs/SPEC.md` 의 "3. 페이지별 기능 명세"

작업 목록:

1. **루트 레이아웃 (`app/layout.tsx`)**
   - metadata: title `빗물펌프장 시설물 관리 시스템 (RPMS)`, description 추가
   - Pretendard 폰트를 `<head>` 에서 CDN으로 로드
   - `<html lang="ko">` 필수

2. **메인 레이아웃 그룹 (`app/(main)/layout.tsx`)**
   - 2열 그리드: 좌측 사이드바(232px) + 우측 메인 영역
   - 모바일(<960px)에서는 1열 (사이드바는 상단 드롭다운/햄버거)

3. **사이드바 (`components/layout/Sidebar.tsx`)**
   - 브랜드 영역: "빗물펌프장 시설물 관리 시스템" + "RPMS v0.1"
   - 섹션 구분:
     - **관리 업무**
       - 📊 대시보드 `/`
       - 🏭 시설물 현황 `/facility`
       - ⚙️ 설비대장 `/equipment`
       - 🧩 **부품 관리** `/parts` ← 신규 강조
       - 🔧 유지보수 이력 `/maintenance`
       - 📅 예방정비 `/pm`
       - ✅ 점검일지 `/inspection`
       - 🔔 알림 · 리마인더 `/alerts`
     - **분석 · 설정**
       - 📈 통계 보고서 `/reports`
       - 🛠️ 시스템 설정 `/settings`
   - 현재 경로(`usePathname`)와 매칭되는 항목은 active 스타일
   - 다크 계열 네이비 배경 (#0f2035), 우측 border accent

4. **탑바 (`components/layout/Topbar.tsx`)**
   - 좌측: 페이지 제목 + 서브타이틀 (props로 받음)
   - 우측: 시설 뱃지 "🏭 월성빗물펌프장", 부서 뱃지 "배수운영과"
   - 하단 1px border

5. **페이지 스캐폴드** — 10개 페이지 각각 기본 `page.tsx` 생성
   - `app/(main)/page.tsx` — 대시보드 (임시: "대시보드" 텍스트)
   - `app/(main)/facility/page.tsx`
   - `app/(main)/equipment/page.tsx`
   - `app/(main)/parts/page.tsx` ★
   - `app/(main)/parts/timeline/page.tsx` ★
   - `app/(main)/maintenance/page.tsx`
   - `app/(main)/pm/page.tsx`
   - `app/(main)/inspection/page.tsx`
   - `app/(main)/alerts/page.tsx`
   - `app/(main)/reports/page.tsx`
   - `app/(main)/settings/page.tsx`

   각 페이지는 Server Component로, 임시로 간단한 제목과 DB 조회 결과 건수 정도만 표시:
   ```tsx
   // 예: app/(main)/parts/page.tsx
   import { prisma } from '@/lib/db';
   export default async function PartsPage() {
     const count = await prisma.part.count();
     return <div>부품 관리 · 총 {count}건</div>;
   }
   ```

6. **전역 CSS 토큰 (`app/globals.css`)**
   - CSS 변수로 디자인 토큰 정의:
     ```css
     @layer base {
       :root {
         --color-accent: #1e4a7a;
         --color-accent-2: #2b6cb0;
         --color-ink: #1a2332;
         --color-ink-2: #4a5568;
         --color-line: #e2e6ed;
         --color-bg: #f5f6f8;
       }
     }
     ```
   - Tailwind `tailwind.config.ts` 에도 반영:
     ```ts
     theme: { extend: { colors: { accent: { DEFAULT: '#1e4a7a', light: '#2b6cb0' } } } }
     ```

7. **검증**
   - `npm run dev` 실행 후 각 메뉴 클릭 시 페이지 전환되는지 확인
   - 부품 관리 페이지에서 `총 48건` 표시되는지 확인
   - 사이드바 active 상태가 정확히 반영되는지 확인

8. **커밋**
   ```bash
   git add .
   git commit -m "feat(layout): 사이드바 + 10개 페이지 스캐폴드"
   ```

완료 후 보고:
- 모든 메뉴가 정상 동작하는지
- 부품 관리 페이지의 48건 표시 확인
- 모바일 반응형 동작 여부
