/**
 * 부품(Part) · 부품 이벤트(PartEvent) 도메인 상수
 *
 * Part.status / PartEvent.eventType 코드는 시드 데이터 및 DB와
 * 일치하므로 임의로 변경하지 마세요.
 */

export const PART_STATUS = {
  overdue: { label: '★ 누적지연', bg: '#fde8e8', fg: '#c53030' },
  normal: { label: '정상주기', bg: '#e6f4ec', fg: '#2f855a' },
  long: { label: '장기주기', bg: '#e8f0f9', fg: '#1e4a7a' },
  new: { label: '◆ 신설설비', bg: '#fef3e2', fg: '#b16a1b' },
  done: { label: '✓ 완료확인', bg: '#e6f4ec', fg: '#2f855a' },
} as const;

export type PartStatus = keyof typeof PART_STATUS;

export const PART_STATUS_KEYS: PartStatus[] = [
  'overdue',
  'normal',
  'long',
  'new',
  'done',
];

export const PART_EVENT_TYPES = {
  done: { symbol: '●', label: '시행 완료', color: '#2f855a' },
  planned: { symbol: '◐', label: '시행 예상', color: '#b16a1b' },
  overdue: { symbol: '★', label: '누적 지연', color: '#c53030' },
  new: { symbol: '◆', label: '신설', color: '#b16a1b' },
} as const;

export type PartEventType = keyof typeof PART_EVENT_TYPES;

export const SYMBOL_TO_EVENT_TYPE: Record<string, PartEventType> = {
  '●': 'done',
  '◐': 'planned',
  '★': 'overdue',
  '◆': 'new',
};

export const TIMELINE_YEARS = [
  2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030,
] as const;

export type TimelineYear = (typeof TIMELINE_YEARS)[number];

export const EQUIPMENT_GROUPS = [
  '펌프',
  '제진기',
  '전기',
  '기계',
  '통신',
  '기타',
] as const;
