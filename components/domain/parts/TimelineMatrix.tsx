'use client';

import { useMemo, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EQUIPMENT_GROUPS, PART_EVENT_TYPES } from '@/lib/part-constants';
import { PartStatusBadge } from './PartStatusBadge';

const FACILITY_OPTIONS = [
  { code: 'ws1', label: '월성1' },
  { code: 'ws2', label: '월성2' },
  { code: 'ws3', label: '월성3' },
  { code: 'ws-daemyeong', label: '대명유수지' },
  { code: 'ws-common', label: '월성공통' },
];

const SYMBOL_CELL: Record<string, string> = {
  '●': 'bg-emerald-600 text-white',
  '◐': 'border-2 border-dashed border-amber-400 text-amber-700 bg-amber-50',
  '★': 'bg-red-600 text-white',
  '◆': 'bg-amber-500 text-white',
};

export type TimelineRow = {
  id: string;
  facilityCode: string;
  facilityLabel: string;
  equipmentGroup: string;
  partName: string;
  status: string;
  statusLabel: string | null;
  eventsByYear: Record<string, string>;
};

export function TimelineMatrix({
  rows,
  years,
}: {
  rows: TimelineRow[];
  years: number[];
}) {
  const [facility, setFacility] = useState('all');
  const [group, setGroup] = useState('all');

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (facility !== 'all' && r.facilityCode !== facility) return false;
        if (group !== 'all' && r.equipmentGroup !== group) return false;
        return true;
      }),
    [rows, facility, group],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="w-36">
          <p className="mb-1 text-[11px] font-medium text-ink-muted">시설</p>
          <Select value={facility} onValueChange={setFacility}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 시설</SelectItem>
              {FACILITY_OPTIONS.map((f) => (
                <SelectItem key={f.code} value={f.code}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-32">
          <p className="mb-1 text-[11px] font-medium text-ink-muted">대분류</p>
          <Select value={group} onValueChange={setGroup}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 분류</SelectItem>
              {EQUIPMENT_GROUPS.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto flex flex-wrap gap-3 text-xs">
          {Object.entries(PART_EVENT_TYPES).map(([key, meta]) => (
            <span
              key={key}
              className="inline-flex items-center gap-1.5 text-ink-muted"
            >
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${SYMBOL_CELL[meta.symbol] ?? ''}`}
              >
                {meta.symbol}
              </span>
              {meta.label}
            </span>
          ))}
        </div>
      </div>

      <p className="text-xs text-ink-muted">
        {filtered.length.toLocaleString('ko-KR')}건 / {years[0]}~{years[years.length - 1]}
      </p>

      <div className="overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="sticky left-0 z-10 w-[80px] bg-muted/40 px-3 py-2 text-left text-xs font-semibold text-ink-muted">
                시설
              </th>
              <th className="w-[80px] px-3 py-2 text-left text-xs font-semibold text-ink-muted">
                대분류
              </th>
              <th className="min-w-[220px] px-3 py-2 text-left text-xs font-semibold text-ink-muted">
                부품/작업
              </th>
              <th className="w-[100px] px-3 py-2 text-left text-xs font-semibold text-ink-muted">
                상태
              </th>
              {years.map((y) => (
                <th
                  key={y}
                  className="w-[42px] border-l border-line px-1 py-2 text-center text-[11px] font-semibold text-ink-muted"
                >
                  {y}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={4 + years.length}
                  className="py-12 text-center text-sm text-ink-muted"
                >
                  조건에 맞는 부품이 없습니다.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="border-t border-line">
                  <td className="sticky left-0 bg-white px-3 py-2 text-xs">
                    {r.facilityLabel}
                  </td>
                  <td className="px-3 py-2 text-xs text-ink-muted">
                    {r.equipmentGroup}
                  </td>
                  <td className="px-3 py-2">{r.partName}</td>
                  <td className="px-3 py-2">
                    <PartStatusBadge
                      status={r.status}
                      statusLabel={r.statusLabel}
                    />
                  </td>
                  {years.map((y) => {
                    const sym = r.eventsByYear[String(y)];
                    return (
                      <td
                        key={y}
                        className="border-l border-line px-1 py-1.5 text-center"
                      >
                        {sym ? (
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${SYMBOL_CELL[sym] ?? ''}`}
                          >
                            {sym}
                          </span>
                        ) : (
                          <span className="text-ink-muted/30">·</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
