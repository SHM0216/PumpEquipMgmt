# Claude Code 프롬프트

이 폴더의 파일들은 **Claude Code에 순차적으로 전달할 프롬프트**입니다. 각 Phase를 차례대로 진행하면 RPMS 전체 시스템이 완성됩니다.

## 사용 방법

### 방법 1: Claude Code 터미널에서 직접 실행

```bash
# 저장소 루트에서 Claude Code 실행
cd rpms
claude

# 프롬프트 내용을 Claude에 복사·붙여넣기
```

### 방법 2: 파일을 파이프로 전달

```bash
claude < prompts/phase1_init.md
```

### 방법 3: Claude Code 프로젝트로 저장

프롬프트를 Claude 슬래시 명령어로 저장하려면:
1. Claude Code 실행 → `/commands` 명령
2. 새 명령 생성 → 프롬프트 내용 붙여넣기
3. 이후 `/rpms-phase1` 형태로 호출

## 진행 순서

| 순서 | 파일 | 소요 | 핵심 산출물 |
|------|------|------|------------|
| 1 | `phase1_init.md` | 2일 | Next.js + Prisma + 시드 완료 |
| 2 | `phase2_layout.md` | 3일 | 사이드바 + 10개 페이지 스캐폴드 |
| 3 | `phase3_equipment.md` | 5일 | 시설·설비 CRUD |
| 4 | **`phase4_parts.md` ★** | 7일 | **부품(Part) 3계층 뷰 + 타임라인** |
| 5 | `phase5_maintenance.md` | 4일 | 유지보수 이력 + Part 연결 |
| 6 | `phase6_pm.md` | 4일 | 예방정비 엔진 + 알림 |
| 7 | `phase7_dashboard.md` | 4일 | 대시보드 + 차트 + CSV |
| 8 | `phase8-10_inspection_auth_deploy.md` | 10일 | 점검·인증·배포 |

## 원칙

1. **순서 준수**: 각 Phase는 이전 Phase 완료가 전제.
2. **완료 확인**: 각 Phase 완료 기준을 통과한 뒤 다음으로.
3. **커밋 단위**: Phase별로 별도 브랜치(`feature/phase4-parts`) → PR → main 머지 권장.
4. **테스트 병행**: 각 Phase 완료 시 수동 테스트 체크리스트 실행.

## Claude Code 활용 팁

### 컨텍스트 주기
Claude Code 세션 시작 시 먼저 이 지시:
> "먼저 CLAUDE.md와 docs/SPEC.md, prisma/schema.prisma를 읽고 프로젝트 컨텍스트를 파악해주세요."

### 지속적 검증 요청
각 작업 후:
> "TypeScript 컴파일 에러가 없는지 확인하고 `npm run typecheck` 실행해주세요."
> "변경사항을 간결한 커밋 메시지와 함께 커밋해주세요."

### 데이터 모델 일관성
DB 변경 시:
> "schema.prisma 변경사항을 확인하고 마이그레이션을 만들어주세요. 시드 스크립트도 함께 업데이트해주세요."

### 디자인 일관성
UI 작업 시:
> "기존 페이지(예: `app/(main)/equipment/page.tsx`)의 톤앤매너를 유지해주세요."

## 다음 단계

Phase 10까지 완료 후:
- 사용자 매뉴얼 작성 (`docs/USER_MANUAL.md`)
- 관리자 가이드 작성 (`docs/ADMIN_GUIDE.md`)
- 확장 Phase 11: 관내 전 펌프장 확대 적용
- 확장 Phase 12: SCADA 연계 (실시간 운전 데이터)
- 확장 Phase 13: AI 기반 예측정비 (과거 이력 → 고장 예측)
