'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PartStatusBadge } from './PartStatusBadge';
import { TIMELINE_YEARS, PART_EVENT_TYPES } from '@/lib/part-constants';
import { parseHistoryLines } from '@/lib/part-utils';
import { fmtDate, fmtKRW } from '@/lib/format';

type PartDetail = {
  id: string;
  facilityCode: string;
  facilityLabel: string;
  equipmentGroup: string;
  partName: string;
  spec: string | null;
  history: string | null;
  cycle: string | null;
  cycleMonths: number | null;
  nextTime: string | null;
  nextYear: number | null;
  status: string;
  statusLabel: string | null;
  overdue: boolean;
  isNew: boolean;
  note: string | null;
  events: Array<{
    id: string;
    year: number;
    eventType: string;
    symbol: string;
    note: string | null;
  }>;
  maintenance: Array<{
    id: string;
    date: string;
    name: string;
    vendor: string | null;
    amount: number;
    contractType: string;
    serialNo: number | null;
  }>;
  equipment: { id: string; name: string; facility: { name: string } } | null;
};

type Props = {
  partId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (id: string) => void;
};

const SYMBOL_BG: Record<string, string> = {
  '●': 'bg-emerald-600 text-white',
  '◐': 'bg-amber-100 text-amber-800 border border-dashed border-amber-400',
  '★': 'bg-red-600 text-white',
  '◆': 'bg-amber-500 text-white',
};

export function PartDetailDialog({
  partId,
  open,
  onOpenChange,
  onEdit,
}: Props) {
  const [part, setPart] = useState<PartDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !partId) {
      setPart(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/parts/${partId}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? '조회 실패');
        return j.part as PartDetail;
      })
      .then((p) => {
        if (!cancelled) setPart(p);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? '오류가 발생했습니다.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [partId, open]);

  const histLines = parseHistoryLines(part?.history);
  const eventsByYear = new Map(
    (part?.events ?? []).map((e) => [e.year, e]),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {part?.partName ?? (loading ? '불러오는 중…' : '부품 상세')}
            {part && (
              <PartStatusBadge status={part.status} statusLabel={part.statusLabel} />
            )}
          </DialogTitle>
          {part && (
            <DialogDescription>
              {part.facilityLabel} · {part.equipmentGroup}
              {part.spec && ` · ${part.spec}`}
            </DialogDescription>
          )}
        </DialogHeader>

        {error && (
          <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}

        {part && (
          <Tabs defaultValue="info">
            <TabsList>
              <TabsTrigger value="info">기본정보</TabsTrigger>
              <TabsTrigger value="history">
                시행 이력 ({histLines.length})
              </TabsTrigger>
              <TabsTrigger value="contracts">
                연관 계약 ({part.maintenance.length})
              </TabsTrigger>
              <TabsTrigger value="timeline">타임라인</TabsTrigger>
            </TabsList>

            <TabsContent value="info">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
                <Row label="시설" value={part.facilityLabel} />
                <Row label="대분류" value={part.equipmentGroup} />
                <Row label="부품/작업" value={part.partName} />
                <Row label="규격·수량" value={part.spec ?? '-'} />
                <Row label="주기" value={part.cycle ?? '-'} />
                <Row
                  label="주기(개월)"
                  value={part.cycleMonths ? `${part.cycleMonths}개월` : '-'}
                />
                <Row label="차기시기" value={part.nextTime ?? '-'} />
                <Row
                  label="차기연도"
                  value={part.nextYear ? `${part.nextYear}년` : '-'}
                />
                {part.equipment && (
                  <Row
                    label="연결 설비"
                    value={`${part.equipment.facility.name} · ${part.equipment.name}`}
                  />
                )}
              </dl>
              {part.note && (
                <p className="mt-3 rounded bg-muted px-3 py-2 text-xs text-ink-muted">
                  {part.note}
                </p>
              )}
              {onEdit && (
                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onEdit(part.id)}
                    className="rounded-md border border-line px-3 py-1.5 text-sm hover:bg-muted"
                  >
                    편집
                  </button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history">
              {histLines.length === 0 ? (
                <p className="py-6 text-center text-sm text-ink-muted">
                  시행 이력이 없습니다.
                </p>
              ) : (
                <ul className="space-y-2">
                  {histLines.map((h, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 rounded border border-line px-3 py-2 text-sm"
                    >
                      <span className="font-mono text-xs font-semibold text-accent">
                        {h.year ?? '----'}
                      </span>
                      <span className="flex-1">{h.text}</span>
                      {h.ref && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-ink-muted">
                          #{h.ref}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>

            <TabsContent value="contracts">
              {part.maintenance.length === 0 ? (
                <p className="py-6 text-center text-sm text-ink-muted">
                  자동 매핑된 계약이 없습니다.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {part.maintenance.map((m) => (
                    <li key={m.id} className="py-2.5 text-sm">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-medium">
                          {m.serialNo && (
                            <span className="mr-1 text-xs text-ink-muted">
                              #{m.serialNo}
                            </span>
                          )}
                          {m.name}
                        </span>
                        <span className="font-semibold text-accent tabular-nums">
                          {fmtKRW(m.amount)}
                        </span>
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-ink-muted">
                        <span>{fmtDate(m.date)}</span>
                        <span>· {m.contractType}</span>
                        {m.vendor && <span>· {m.vendor}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>

            <TabsContent value="timeline">
              <div className="overflow-x-auto rounded border border-line">
                <table className="w-full text-center text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      {TIMELINE_YEARS.map((y) => (
                        <th
                          key={y}
                          className="border-l border-line px-2 py-2 text-xs font-semibold text-ink-muted first:border-l-0"
                        >
                          {y}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {TIMELINE_YEARS.map((y) => {
                        const ev = eventsByYear.get(y);
                        return (
                          <td
                            key={y}
                            className="border-l border-t border-line px-1 py-3 first:border-l-0"
                          >
                            {ev ? (
                              <span
                                className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm ${SYMBOL_BG[ev.symbol] ?? ''}`}
                                title={
                                  PART_EVENT_TYPES[
                                    ev.eventType as keyof typeof PART_EVENT_TYPES
                                  ]?.label ?? ev.eventType
                                }
                              >
                                {ev.symbol}
                              </span>
                            ) : (
                              <span className="text-ink-muted/30">·</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
              <Legend />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <>
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </>
  );
}

function Legend() {
  return (
    <div className="mt-3 flex flex-wrap gap-3 text-xs">
      {Object.entries(PART_EVENT_TYPES).map(([key, meta]) => (
        <span key={key} className="inline-flex items-center gap-1.5 text-ink-muted">
          <span
            className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${SYMBOL_BG[meta.symbol] ?? ''}`}
          >
            {meta.symbol}
          </span>
          {meta.label}
        </span>
      ))}
    </div>
  );
}
