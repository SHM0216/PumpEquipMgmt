# Phase 1: 프로젝트 초기화

다음 내용을 Claude Code 세션에 그대로 붙여 넣어 실행합니다.

---

RPMS(빗물펌프장 시설물 관리 시스템) 프로젝트를 초기화해주세요.

**먼저 `CLAUDE.md`와 `prisma/schema.prisma`를 읽어 프로젝트 컨텍스트를 파악해주세요.**

작업 목록:

1. **Next.js 15 프로젝트 초기화**
   - `npx create-next-app@latest .` 실행
   - 옵션: TypeScript, ESLint, Tailwind CSS, App Router, src 폴더 미사용, import alias `@/*`

2. **의존성 설치**
   ```bash
   npm i @prisma/client zod date-fns recharts lucide-react clsx tailwind-merge class-variance-authority
   npm i -D prisma tsx prettier prettier-plugin-tailwindcss
   ```

3. **Prisma 설정**
   - `prisma/schema.prisma`가 이미 있다면 그대로 사용 (건드리지 말 것)
   - `.env.example` 를 참고해 `.env.local` 생성, `DATABASE_URL="file:./prisma/dev.db"` 설정
   - `npx prisma generate` 실행
   - `npx prisma migrate dev --name init` 실행

4. **shadcn/ui 초기화**
   ```bash
   npx shadcn@latest init
   ```
   - 스타일: Default, 색상: Neutral, CSS 변수 사용
   - 기본 컴포넌트 설치:
   ```bash
   npx shadcn@latest add button input select label textarea dialog badge card tabs table separator dropdown-menu toast
   ```

5. **Pretendard 폰트 설정**
   - `app/layout.tsx` 에서 Pretendard Variable 웹폰트 로드
   - `app/globals.css` 의 `@layer base`에 `html { font-family: 'Pretendard Variable', 'Pretendard', ... }` 추가

6. **유틸리티 작성**
   - `lib/db.ts` — Prisma Client singleton (Next.js dev mode HMR 대응)
   - `lib/format.ts` — `fmtNumber`, `fmtMan`, `fmtDate`, `fmtMoney`, `fmtDateKo` 함수
   - `lib/constants.ts` — `CATEGORIES`, `SUBCATEGORIES`, `PART_STATUS_CODES`, `FACILITY_KINDS` 상수

   `lib/constants.ts` 에 반드시 포함할 내용:
   ```ts
   export const CATEGORIES = ['펌프','제진기','전기','기계','통신','기타'] as const;
   export type Category = typeof CATEGORIES[number];

   export const SUBCATEGORIES: Record<Category, string[]> = {
     '펌프': ['펌프 오버홀','전동펌프 수선','펌프 오일','펌프 계측','펌프 부속품','진공펌프','펌프 기초'],
     '제진기': ['제진기','컨베이어(협잡물)','암롤박스'],
     '전기': ['수·배전설비','보호계전/개폐기','조명/환기','전력케이블','비상발전기','컨베이어 전기공사','기동반','제어반','수위계(계측)','축전지','냉방 전기공사','교통신호등'],
     '기계': ['고무보/기계실','냉방기','크레인','수문권양기','소방설비'],
     '통신': ['CCTV','영상정보처리시스템','통합감시시스템'],
     '기타': ['안전점검 용역','시설물/건축 보수','월성교(교량)','준설','유류','기타'],
   };

   export const PART_STATUS_CODES = ['정상주기','누적지연','신설설비','장기주기','완료확인'] as const;
   export type PartStatusCode = typeof PART_STATUS_CODES[number];

   export const PART_STATUS_STYLE: Record<PartStatusCode, { label: string; color: string; bg: string }> = {
     '정상주기':   { label: '정상주기',  color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
     '누적지연':   { label: '★ 누적지연', color: 'text-red-700',     bg: 'bg-red-50 border-red-200' },
     '신설설비':   { label: '◆ 신설',     color: 'text-sky-700',     bg: 'bg-sky-50 border-sky-200' },
     '장기주기':   { label: '장기주기',  color: 'text-slate-600',   bg: 'bg-slate-50 border-slate-200' },
     '완료확인':   { label: '✓ 완료',    color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
   };
   ```

7. **시드 실행 설정**
   - `package.json`에 `"prisma": { "seed": "tsx prisma/seed.ts" }` 추가 (이미 있다면 확인만)
   - `seed/*.json` 파일이 모두 있는지 확인 (facilities, equipment, parts, maintenance, pm_master)
   - `npx prisma db seed` 실행하여 **48개 부품**을 포함한 시드 데이터 투입

8. **초기 실행 확인**
   - `npm run dev`로 개발 서버 실행 (http://localhost:3000)
   - `npx prisma studio`로 DB에 Facility 5건, Part 48건이 들어있는지 확인

9. **Git 초기 커밋**
   ```bash
   git init
   git add .
   git commit -m "chore: 프로젝트 초기화 - Next.js 15 + Prisma + shadcn/ui"
   ```

작업 완료 후 다음을 알려주세요:
- Prisma Studio에서 확인한 Facility/Part 건수
- `http://localhost:3000` 접속 시 기본 Next.js 페이지가 정상 표시되는지
- 다음 Phase 2(레이아웃)로 넘어갈 준비 여부
