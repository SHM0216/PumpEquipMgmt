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
import { Badge } from '@/components/ui/badge';
import { fmtDate, fmtKRW, elapsedFromInstall } from '@/lib/format';

type EquipmentDetail = {
  id: string;
  facilityId: string;
  category: string;
  subcategory: string;
  name: string;
  model: string | null;
  vendor: string | null;
  installDate: string | null;
  lifeYears: number | null;
  lastMaintDate: string | null;
  status: string;
  remark: string | null;
  facility: { id: string; name: string };
  parts: Array<{ id: string; partName: string; status: string; statusLabel: string | null }>;
  maintenance: Array<{
    id: string;
    date: string;
    name: string;
    vendor: string | null;
    amount: number;
    contractType: string;
    description: string | null;
  }>;
};

type Props = {
  equipmentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (id: string) => void;
};

const STATUS_VARIANT: Record<
  string,
  'success' | 'warning' | 'danger' | 'secondary'
> = {
  good: 'success',
  warn: 'warning',
  bad: 'danger',
};
const STATUS_LABEL: Record<string, string> = {
  good: '정상',
  warn: '주의',
  bad: '위험',
};

const PART_STATUS_VARIANT: Record<
  string,
  'success' | 'warning' | 'danger' | 'info' | 'secondary'
> = {
  normal: 'success',
  overdue: 'danger',
  long: 'secondary',
  new: 'info',
  done: 'success',
};

export function EquipmentCardDialog({
  equipmentId,
  open,
  onOpenChange,
  onEdit,
}: Props) {
  const [data, setData] = useState<EquipmentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !equipmentId) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/equipment/${equipmentId}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? '조회 실패');
        return j.equipment as EquipmentDetail;
      })
      .then((eq) => {
        if (!cancelled) setData(eq);
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
  }, [equipmentId, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {data?.name ?? (loading ? '불러오는 중…' : '설비 상세')}
            {data && (
              <Badge variant={STATUS_VARIANT[data.status] ?? 'secondary'}>
                {STATUS_LABEL[data.status] ?? data.status}
              </Badge>
            )}
          </DialogTitle>
          {data && (
            <DialogDescription>
              {data.facility.name} · {data.category} · {data.subcategory}
            </DialogDescription>
          )}
        </DialogHeader>

        {error && (
          <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}

        {data && (
          <Tabs defaultValue="info">
            <TabsList>
              <TabsTrigger value="info">기본정보</TabsTrigger>
              <TabsTrigger value="maintenance">
                정비이력 ({data.maintenance.length})
              </TabsTrigger>
              <TabsTrigger value="pm">예방정비</TabsTrigger>
            </TabsList>

            <TabsContent value="info">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
                <Row label="시설" value={data.facility.name} />
                <Row label="대분류" value={data.category} />
                <Row label="세부구분" value={data.subcategory} />
                <Row label="모델" value={data.model ?? '-'} />
                <Row label="제조사" value={data.vendor ?? '-'} />
                <Row label="설치일" value={fmtDate(data.installDate)} />
                <Row
                  label="경과"
                  value={elapsedFromInstall(data.installDate)}
                />
                <Row
                  label="내용연수"
                  value={data.lifeYears ? `${data.lifeYears}년` : '-'}
                />
                <Row
                  label="최근정비"
                  value={fmtDate(data.lastMaintDate)}
                />
                <Row label="상태" value={STATUS_LABEL[data.status] ?? data.status} />
              </dl>
              {data.remark && (
                <p className="mt-3 rounded bg-muted px-3 py-2 text-xs text-ink-muted">
                  {data.remark}
                </p>
              )}
              {data.parts.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold text-ink-muted">
                    연결 부품 ({data.parts.length})
                  </p>
                  <ul className="space-y-1 text-sm">
                    {data.parts.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center gap-2 rounded border border-line px-2 py-1.5"
                      >
                        <span className="flex-1 truncate">{p.partName}</span>
                        <Badge
                          variant={
                            PART_STATUS_VARIANT[p.status] ?? 'secondary'
                          }
                        >
                          {p.statusLabel ?? p.status}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {onEdit && (
                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onEdit(data.id)}
                    className="rounded-md border border-line px-3 py-1.5 text-sm hover:bg-muted"
                  >
                    편집
                  </button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="maintenance">
              {data.maintenance.length === 0 ? (
                <p className="py-6 text-center text-sm text-ink-muted">
                  연결된 정비 이력이 없습니다.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {data.maintenance.map((m) => (
                    <li key={m.id} className="py-2.5 text-sm">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-medium">{m.name}</span>
                        <span className="font-semibold text-accent tabular-nums">
                          {fmtKRW(m.amount)}
                        </span>
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-ink-muted">
                        <span>{fmtDate(m.date)}</span>
                        <span>· {m.contractType}</span>
                        {m.vendor && <span>· {m.vendor}</span>}
                      </div>
                      {m.description && (
                        <p className="mt-1 text-xs text-ink-muted">
                          {m.description}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>

            <TabsContent value="pm">
              <p className="py-4 text-sm text-ink-muted">
                Phase 6에서 PmMaster 매칭(대분류·세부구분) → 차기 예정일이
                계산됩니다. 현재는 마스터 정보만 참조 가능합니다.
              </p>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <Row label="매칭 대분류" value={data.category} />
                <Row label="매칭 세부구분" value={data.subcategory} />
                <Row
                  label="최근정비"
                  value={fmtDate(data.lastMaintDate)}
                />
              </dl>
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
