import { PART_STATUS, type PartStatus } from './part-constants';

/**
 * Part 상태 배지 정보
 */
export function getPartStatusBadge(part: {
  status: string;
  statusLabel?: string | null;
}) {
  const meta = (PART_STATUS as Record<string, { label: string; bg: string; fg: string }>)[
    part.status
  ] ?? PART_STATUS.normal;
  return {
    label: part.statusLabel || meta.label,
    bg: meta.bg,
    fg: meta.fg,
  };
}

/**
 * 시행 이력 텍스트 파싱
 * "• 2022: 오버홀 공사 [#42]" → { year: 2022, text: '오버홀 공사', ref: '42' }
 */
export type HistoryLine = {
  year: number | null;
  text: string;
  ref: string | null;
};

export function parseHistoryLines(history: string | null | undefined): HistoryLine[] {
  if (!history) return [];
  return history
    .split(/\n|•/u)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^(\d{4}):\s*(.+?)(?:\s*\[#(\d+)\])?\s*$/u);
      if (!m) return { year: null, text: line, ref: null };
      return { year: Number(m[1]), text: m[2].trim(), ref: m[3] || null };
    });
}

/**
 * 부품의 차기 시기까지 남은 연수 (음수면 경과)
 */
export function getYearsUntilDue(part: {
  nextYear: number | null;
}): number | null {
  if (part.nextYear == null) return null;
  return part.nextYear - new Date().getFullYear();
}

/**
 * Part 상태가 유효한 코드인지 검증
 */
export function isValidPartStatus(s: string): s is PartStatus {
  return s in PART_STATUS;
}
