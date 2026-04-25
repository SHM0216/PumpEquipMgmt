# Phase 8~10: 점검·인증·배포 (요약)

3개 Phase를 간결하게 정리. 각 Phase 시작 시 이 프롬프트에서 해당 부분만 추출하여 Claude Code에 전달.

---

# Phase 8: 점검일지 + 첨부파일

## 작업 1: 점검일지 페이지

### `app/(main)/inspection/page.tsx`
- 목록 (필터: 유형/시설/결과/기간)
- 등록 폼 Dialog

### 등록 폼 필드
- 점검일 / 유형(일일/주간/월간/정밀안전/수시) / 시설 / 결과(정상/지적/위험) / 점검자
- **점검 대상 선택**: Facility만 / Equipment / Part 중 선택 가능
- 점검 내용·지적사항 (textarea)
- 첨부파일 업로드 (사진 · 보고서 · 기타)

## 작업 2: 첨부파일 업로드

### `app/api/upload/route.ts`
- `FormData` 수신 (multipart/form-data)
- 파일 검증:
  - 최대 50MB (환경변수)
  - MIME 화이트리스트: image/*, application/pdf, .hwp, .docx, .xlsx
- 저장: `./public/uploads/{yyyyMM}/{cuid}.{ext}`
- `Attachment` 레코드 생성 (refType, refId, filepath 등)

### 보안
- 확장자 검증 (매직바이트 체크 권장)
- 파일명 sanitize (cuid로 변환)
- 업로드 경로 traversal 방지

## 작업 3: 첨부파일 표시
- 점검·유지보수·Part·Equipment 상세에 각각 "첨부파일" 탭 추가
- 썸네일(이미지) + 다운로드 링크

## 커밋
```bash
git commit -m "feat(inspection): 점검일지 + 첨부파일 업로드"
```

---

# Phase 9: 인증 · 권한 · 감사로그

## 작업 1: NextAuth v5

```bash
npm i next-auth@beta @auth/prisma-adapter bcryptjs
npm i -D @types/bcryptjs
```

### `auth.ts` (프로젝트 루트)
- Credentials Provider (아이디/비번 → bcrypt 비교)
- 세션에 role 포함

### 로그인 페이지 `app/login/page.tsx`
- shadcn/ui Input + Button
- 로그인 실패 시 에러 표시

### 미들웨어 `middleware.ts`
- 비로그인 시 `/login`으로 리다이렉트
- `/api/**` 중 일부는 공개 허용 (health check 등)

## 작업 2: RBAC

역할별 권한:
- `ADMIN`: 모든 기능 + 사용자 관리 + 주기 마스터
- `MANAGER`: CRUD 전체
- `VIEWER`: 조회만 (등록/수정/삭제 버튼 숨김)
- `FIELD`: 점검 입력만

### `lib/auth-helpers.ts`
```ts
export async function requireRole(roles: Role[]) {
  const session = await auth();
  if (!session || !roles.includes(session.user.role)) {
    throw new Error('권한이 없습니다.');
  }
  return session;
}
```

## 작업 3: 감사 로그

### `lib/audit.ts`
```ts
export async function audit(action: string, target: string, targetId: string, changes?: any) {
  const session = await auth();
  await prisma.auditLog.create({
    data: {
      userId: session?.user.id,
      action, target, targetId,
      changes: changes ? JSON.stringify(changes) : null,
    },
  });
}
```

### 모든 mutation API에 삽입
CREATE/UPDATE/DELETE 시 `audit(...)` 호출.

## 작업 4: 사용자 관리 화면
`app/(main)/settings/users/page.tsx` — ADMIN만 접근 가능.

## 커밋
```bash
git commit -m "feat(auth): NextAuth v5 + RBAC + 감사로그"
```

---

# Phase 10: Docker 배포

## 작업 1: Dockerfile

```dockerfile
# stage 1: deps
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# stage 2: builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

# stage 3: runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/seed ./seed
USER nextjs
EXPOSE 3000
CMD ["npm","start"]
```

## 작업 2: docker-compose.yml

```yaml
version: '3.8'
services:
  db:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: rpms
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: rpms
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"
  app:
    build: .
    restart: always
    environment:
      DATABASE_URL: postgresql://rpms:${POSTGRES_PASSWORD}@db:5432/rpms
      NEXTAUTH_URL: http://localhost:3000
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
    ports:
      - "3000:3000"
    depends_on:
      - db
    volumes:
      - ./public/uploads:/app/public/uploads
volumes:
  pgdata:
```

## 작업 3: PostgreSQL 전환

1. `prisma/schema.prisma` 의 datasource 수정:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. 기존 SQLite 데이터 export → PostgreSQL import
   ```bash
   # SQLite 데이터 백업
   npm run db:export > backup.json
   # PostgreSQL 마이그레이션 적용
   npx prisma migrate deploy
   # 시드 재실행
   npx prisma db seed
   ```

## 작업 4: 백업 스크립트

### `scripts/backup.sh`
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
# DB
docker exec rpms-db-1 pg_dump -U rpms rpms > "/backup/rpms_${DATE}.sql"
# 업로드 파일
tar -czf "/backup/uploads_${DATE}.tar.gz" ./public/uploads
# 30일 이상 파일 삭제
find /backup -name "*.sql" -mtime +30 -delete
find /backup -name "*.tar.gz" -mtime +30 -delete
```

crontab에 등록: `0 3 * * * /app/scripts/backup.sh` (매일 새벽 3시).

## 작업 5: 배포 문서

### `docs/DEPLOY.md`
- 서버 요구사항
- 설치 순서
- 환경변수 목록
- 초기 관리자 계정 생성
- 트러블슈팅

## 커밋
```bash
git commit -m "chore(deploy): Docker + PostgreSQL + 백업 스크립트"
```
