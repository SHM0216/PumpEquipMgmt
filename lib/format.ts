/**
 * 한국어 로케일 포매팅 유틸
 */

/**
 * 천단위 콤마 — 정수
 * 1234567 → "1,234,567"
 */
export function fmtNumber(n: number | bigint | null | undefined): string {
  if (n == null) return '-';
  return Number(n).toLocaleString('ko-KR');
}

/**
 * 백만원 단위로 축약
 * 1234567000 → "1,234"
 */
export function fmtMillion(n: number | bigint | null | undefined): string {
  if (n == null) return '-';
  return Math.round(Number(n) / 1_000_000).toLocaleString('ko-KR');
}

/**
 * 억원 단위로 축약
 * 1234567000 → "12.3"
 */
export function fmtBillion(n: number | bigint | null | undefined): string {
  if (n == null) return '-';
  return (Number(n) / 100_000_000).toFixed(1);
}

/**
 * 원 단위 — "1,234,567 원"
 */
export function fmtKRW(n: number | bigint | null | undefined): string {
  if (n == null) return '-';
  return `${Number(n).toLocaleString('ko-KR')} 원`;
}

/**
 * 날짜 — "2024-08-08" (YYYY-MM-DD)
 */
export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '-';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '-';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * 한글 날짜 — "2024년 8월 8일"
 */
export function fmtDateKr(d: Date | string | null | undefined): string {
  if (!d) return '-';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '-';
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

/**
 * 두 날짜 사이의 일수
 */
export function daysBetween(from: Date | string, to: Date | string): number {
  const a = typeof from === 'string' ? new Date(from) : from;
  const b = typeof to === 'string' ? new Date(to) : to;
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/**
 * 경과 기간 — "3년 2개월 경과"
 */
export function elapsedFromInstall(installDate: Date | string | null | undefined): string {
  if (!installDate) return '-';
  const d = typeof installDate === 'string' ? new Date(installDate) : installDate;
  const now = new Date();
  const totalMonths =
    (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years === 0) return `${months}개월`;
  if (months === 0) return `${years}년`;
  return `${years}년 ${months}개월`;
}

/**
 * BigInt-safe JSON 직렬화
 * Prisma BigInt는 JSON.stringify가 막히므로 변환 필요
 */
export function bigintReplacer(_key: string, value: unknown): unknown {
  if (typeof value === 'bigint') return Number(value);
  return value;
}

/**
 * 객체에 BigInt가 있을 수 있을 때 안전한 클라이언트 직렬화
 */
export function serialize<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj, bigintReplacer));
}
