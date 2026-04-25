# 배포 가이드 (DEPLOY)

## 배포 아키텍처

```
┌ 내부망 서버 (Ubuntu 22.04 또는 Rocky Linux 8+) ────┐
│                                                    │
│  ┌ Docker Compose ──────────────────────────────┐ │
│  │  app (Next.js)  ────  db (PostgreSQL 16)    │ │
│  │    :3000               :5432                 │ │
│  │                                              │ │
│  │  볼륨:                                       │ │
│  │    - ./public/uploads  (첨부파일)            │ │
│  │    - ./pgdata          (DB 데이터)           │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  Nginx Reverse Proxy (optional) :80/:443           │
└────────────────────────────────────────────────────┘
```

## 서버 요구사항

| 항목 | 최소 | 권장 |
|------|------|------|
| CPU | 2 Core | 4 Core |
| RAM | 4GB | 8GB |
| 디스크 | 50GB | 200GB (첨부파일 용) |
| OS | Ubuntu 22.04 / Rocky 8+ | 동일 |
| Docker | 24+ | 24+ |
| 네트워크 | 내부망 전용 | 내부망 전용 |

## 설치 순서

### 1. Docker 설치
```bash
# Ubuntu 기준
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

### 2. 저장소 복제
```bash
git clone https://github.com/<your-org>/rpms.git /opt/rpms
cd /opt/rpms
```

### 3. 환경변수 설정
```bash
cp .env.example .env.production

# .env.production 편집 — 다음 항목 필수:
# DATABASE_URL=postgresql://rpms:강력한비번@db:5432/rpms
# NEXTAUTH_URL=http://rpms.example.go.kr
# NEXTAUTH_SECRET=$(openssl rand -base64 32)
# POSTGRES_PASSWORD=위와 동일한 비번
```

### 4. Docker Compose 실행
```bash
docker compose build
docker compose up -d

# 상태 확인
docker compose ps
docker compose logs -f app
```

### 5. DB 마이그레이션 + 시드
```bash
docker compose exec app npx prisma migrate deploy
docker compose exec app npx prisma db seed
```

### 6. 초기 관리자 계정 생성
```bash
docker compose exec app npx tsx scripts/create-admin.ts
# 대화형으로 username, 비번, 이름 입력
```

### 7. 접속 확인
- http://서버IP:3000 으로 접속
- 관리자 계정 로그인 확인
- 부품 관리 메뉴에서 48건 시드 데이터 확인

## Nginx 리버스 프록시 (권장)

### `/etc/nginx/sites-available/rpms`
```nginx
server {
    listen 80;
    server_name rpms.example.go.kr;

    client_max_body_size 50M;  # 첨부파일 업로드

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 업데이트 배포

```bash
cd /opt/rpms
git pull
docker compose build app
docker compose up -d app
docker compose exec app npx prisma migrate deploy
```

## 백업

### 자동 백업 (crontab)
```bash
# crontab -e
0 3 * * * /opt/rpms/scripts/backup.sh >> /var/log/rpms-backup.log 2>&1
```

### 수동 백업
```bash
/opt/rpms/scripts/backup.sh
# 결과: /backup/rpms_YYYYMMDD_HHMMSS.sql 및 uploads.tar.gz
```

### 복구
```bash
# DB 복구
cat /backup/rpms_20260424_030000.sql | docker compose exec -T db psql -U rpms rpms

# 첨부파일 복구
tar -xzf /backup/uploads_20260424_030000.tar.gz -C /opt/rpms/
```

## 트러블슈팅

### DB 연결 실패
```bash
docker compose logs db
# PostgreSQL이 기동될 때까지 대기 후 app 재시작
docker compose restart app
```

### 포트 충돌
- 3000 포트가 사용 중이면 `docker-compose.yml` 의 `"3000:3000"` → `"3001:3000"` 변경

### 첨부파일이 안 보임
- 볼륨 마운트 확인: `docker compose exec app ls /app/public/uploads`
- 권한 확인: `chown -R 1001:1001 ./public/uploads`

### 마이그레이션 오류
```bash
# 최후 수단 — 개발 서버에서만 사용
docker compose exec app npx prisma migrate reset
```

## 모니터링 (선택)

- `docker stats` 로 리소스 사용량 확인
- 로그 로테이션: `/etc/logrotate.d/docker` 설정 확인
- Prometheus + Grafana 연동 (Phase 11+)
