'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fmtDate } from '@/lib/format';
import { InspectionEditorDialog } from './InspectionEditorDialog';

export type InspectionRow = {
  id: string;
  date: string;
  facility: { id: string; name: string };
  inspType: string;
  target: string;
  result: string;
  inspector: string | null;
  memo: string | null;
};

const RESULT_VARIANT: Record<string, 'success' | 'warning' | 'danger'> = {
  정상: 'success',
  지적: 'warning',
  위험: 'danger',
};

const TYPE_VARIANT: Record<
  string,
  'default' | 'secondary' | 'outline' | 'info'
> = {
  일일: 'secondary',
  주간: 'secondary',
  월간: 'default',
  정밀안전: 'info',
  수시: 'outline',
};

type Facility = { id: string; name: string };

export function InspectionList({
  rows,
  facilities,
}: {
  rows: InspectionRow[];
  facilities: Facility[];
}) {
  const router = useRouter();
  const [facility, setFacility] = useState('all');
  const [type, setType] = useState('all');
  const [result, setResult] = useState('all');
  const [editorOpen, setEditorOpen] = useState(false);

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (facility !== 'all' && r.facility.id !== facility) return false;
        if (type !== 'all' && r.inspType !== type) return false;
        if (result !== 'all' && r.result !== result) return false;
        return true;
      }),
    [rows, facility, type, result],
  );

  async function handleDelete(id: string, target: string) {
    if (!confirm(`'${target}' 점검을 삭제하시겠습니까?`)) return;
    const res = await fetch(`/api/inspections/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      alert('삭제 실패');
      return;
    }
    router.refresh();
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap items-end gap-2">
        <Filter label="시설" className="w-44">
          <Select value={facility} onValueChange={setFacility}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {facilities.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Filter>
        <Filter label="유형" className="w-32">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="일일">일일</SelectItem>
              <SelectItem value="주간">주간</SelectItem>
              <SelectItem value="월간">월간</SelectItem>
              <SelectItem value="정밀안전">정밀안전</SelectItem>
              <SelectItem value="수시">수시</SelectItem>
            </SelectContent>
          </Select>
        </Filter>
        <Filter label="결과" className="w-28">
          <Select value={result} onValueChange={setResult}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="정상">정상</SelectItem>
              <SelectItem value="지적">지적</SelectItem>
              <SelectItem value="위험">위험</SelectItem>
            </SelectContent>
          </Select>
        </Filter>
        <div className="flex-1" />
        <Button onClick={() => setEditorOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          점검 등록
        </Button>
      </div>

      <p className="mb-2 text-xs text-ink-muted">
        총 <strong className="text-ink">{filtered.length}</strong>건
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-white py-16 text-center text-sm text-ink-muted">
          등록된 점검이 없습니다. 「점검 등록」 버튼으로 시작해주세요.
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((r) => (
            <li
              key={r.id}
              className="rounded-lg border border-line bg-white px-4 py-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={TYPE_VARIANT[r.inspType] ?? 'secondary'}>
                  {r.inspType}
                </Badge>
                <Badge variant={RESULT_VARIANT[r.result] ?? 'secondary'}>
                  {r.result}
                </Badge>
                <span className="text-xs tabular-nums text-ink-muted">
                  {fmtDate(r.date)}
                </span>
                <span className="text-xs text-ink-muted">
                  {r.facility.name.replace('월성 제', '월성')}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(r.id, r.target)}
                  className="ml-auto rounded p-1 text-ink-muted hover:bg-red-50 hover:text-red-700"
                  aria-label="삭제"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="mt-2 font-medium">{r.target}</p>
              {r.memo && (
                <p className="mt-1 text-sm text-ink-muted whitespace-pre-line">
                  {r.memo}
                </p>
              )}
              {r.inspector && (
                <p className="mt-1 text-[11px] text-ink-muted">
                  점검자 · {r.inspector}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <InspectionEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        facilities={facilities}
      />
    </>
  );
}

function Filter({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <p className="mb-1 text-[11px] font-medium text-ink-muted">{label}</p>
      {children}
    </div>
  );
}
