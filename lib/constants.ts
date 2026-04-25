/**
 * RPMS 도메인 상수
 *
 * 6대분류 33세부구분 + 부품 상태 + 타임라인 이벤트 정의.
 * 이 파일의 키·라벨은 시드 데이터 및 DB와 일치하므로 임의로 변경하지 마세요.
 */

// ─────────────────────────────────────────────────────
// 6대분류
// ─────────────────────────────────────────────────────
export const CATEGORIES = ['펌프', '제진기', '전기', '기계', '통신', '기타'] as const;
export type Category = (typeof CATEGORIES)[number];

// ─────────────────────────────────────────────────────
// 33세부구분
// ─────────────────────────────────────────────────────
export const SUBCATEGORIES: Record<Category, readonly string[]> = {
  펌프: [
    '펌프 오버홀',
    '전동펌프 수선',
    '펌프 오일',
    '펌프 계측',
    '펌프 부속품',
    '진공펌프',
    '펌프 기초',
  ],
  제진기: ['제진기', '컨베이어(협잡물)', '암롤박스'],
  전기: [
    '수·배전설비',
    '보호계전/개폐기',
    '조명/환기',
    '전력케이블',
    '비상발전기',
    '컨베이어 전기공사',
    '기동반',
    '제어반',
    '수위계(계측)',
    '축전지',
    '냉방 전기공사',
    '교통신호등',
  ],
  기계: ['고무보/기계실', '냉방기', '크레인', '수문권양기', '소방설비'],
  통신: ['CCTV', '영상정보처리시스템', '통합감시시스템'],
  기타: ['안전점검 용역', '시설물/건축 보수', '월성교(교량)', '준설', '유류', '기타'],
} as const;

// ─────────────────────────────────────────────────────
// 시설 식별 코드
// ─────────────────────────────────────────────────────
export const FACILITY_CODES = ['ws1', 'ws2', 'ws3', 'ws-daemyeong', 'ws-common'] as const;
export type FacilityCode = (typeof FACILITY_CODES)[number];

export const FACILITY_LABELS = ['월성1', '월성2', '월성3', '대명유수지', '월성공통'] as const;

export const FACILITY_LABEL_TO_CODE: Record<string, FacilityCode> = {
  월성1: 'ws1',
  월성2: 'ws2',
  월성3: 'ws3',
  대명유수지: 'ws-daemyeong',
  월성공통: 'ws-common',
};

// ─────────────────────────────────────────────────────
// 설비 상태 (Equipment.status)
// ─────────────────────────────────────────────────────
export const EQUIPMENT_STATUS = {
  good: { label: '정상', bg: '#e6f4ec', fg: '#2f855a' },
  warn: { label: '주의', bg: '#fdf6e4', fg: '#b7791f' },
  bad: { label: '위험', bg: '#fde8e8', fg: '#c53030' },
} as const;

// ─────────────────────────────────────────────────────
// 부품 상태 (Part.status)
// ─────────────────────────────────────────────────────
export const PART_STATUS = {
  overdue: { label: '★ 누적지연', bg: '#fde8e8', fg: '#c53030' },
  normal: { label: '정상주기', bg: '#e6f4ec', fg: '#2f855a' },
  long: { label: '장기주기', bg: '#e8f0f9', fg: '#1e4a7a' },
  new: { label: '◆ 신설설비', bg: '#fef3e2', fg: '#b16a1b' },
  done: { label: '✓ 완료확인', bg: '#e6f4ec', fg: '#2f855a' },
} as const;

export type PartStatus = keyof typeof PART_STATUS;

// ─────────────────────────────────────────────────────
// 타임라인 이벤트 (PartEvent.eventType)
// ─────────────────────────────────────────────────────
export const PART_EVENT_TYPES = {
  done: { symbol: '●', label: '시행 완료', bg: '#2f855a', fg: '#ffffff' },
  planned: { symbol: '◐', label: '시행 예상', bg: '#fef3e2', fg: '#b16a1b' },
  overdue: { symbol: '★', label: '누적 지연', bg: '#c53030', fg: '#ffffff' },
  new: { symbol: '◆', label: '신설', bg: '#fef3e2', fg: '#b16a1b' },
} as const;

export type PartEventType = keyof typeof PART_EVENT_TYPES;

// ─────────────────────────────────────────────────────
// 타임라인 연도 범위
// ─────────────────────────────────────────────────────
export const TIMELINE_YEARS = [
  2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030,
] as const;

// ─────────────────────────────────────────────────────
// 계약 종류
// ─────────────────────────────────────────────────────
export const CONTRACT_TYPES = ['공사', '용역', '물품'] as const;
export type ContractType = (typeof CONTRACT_TYPES)[number];

// ─────────────────────────────────────────────────────
// 점검 유형
// ─────────────────────────────────────────────────────
export const INSPECTION_TYPES = ['일일점검', '주간점검', '월간점검', '정밀안전점검', '수시점검'] as const;
export type InspectionType = (typeof INSPECTION_TYPES)[number];

// ─────────────────────────────────────────────────────
// 점검 결과
// ─────────────────────────────────────────────────────
export const INSPECTION_RESULTS = ['정상', '지적', '위험'] as const;

// ─────────────────────────────────────────────────────
// 사용자 권한
// ─────────────────────────────────────────────────────
export const USER_ROLES = {
  ADMIN: { label: '시스템 관리자' },
  MANAGER: { label: '담당자' },
  VIEWER: { label: '조회 전용' },
  FIELD: { label: '현장 점검' },
} as const;
