'use client';

import { useMemo, useState } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { fmtDate, fmtNumber, fmtBillion, fmtMillion } from '@/lib/format';
import { CATEGORIES } from '@/lib/constants';
import { useRouter } from 'next/navigation';
import { MaintenanceEditorDialog } from './MaintenanceEditorDialog';

export type MaintenanceRow = {
  id: string;
  date: string;
  year: number;
  facilityId: string;
  facility: { id: string; name: string };
  category: string;
  subcategory: string;
  name: string;
  vendor: string | null;
  amount: number;
  contractType: string;
  contractNo: string | null;
  partId: string | null;
  part: {
    id: string;
    partName: string;
    status: string;
    statusLabel: string | null;
  } | null;
};

const CATEGORY_VARIANT: Record<
  string,
  'info' | 'success' | 'warning' | 'secondary' | 'outline' | 'danger'
> = {
  펌프: 'info',
  제진기: 'warning',
  전기: 'danger',
  기계: 'secondary',
  통신: 'success',
  기타: 'outline',
};

const CONTRACT_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  공사: 'default',
  용역: 'secondary',
  물품: 'outline',
};

type Facility = { id: string; name: string };

export function MaintenanceList({
  rows,
  facilities,
  years,
}: {
  rows: MaintenanceRow[];
  facilities: Facility[];
  years: number[];
}) {
  const router = useRouter();
  const [facility, setFacility] = useState('all');
  const [category, setCategory] = useState('all');
  const [year, setYear] = useState('all');
  const [contractType, setContractType] = useState('all');
  const [q, setQ] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [editorId, setEditorId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const lower = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (facility !== 'all' && r.facilityId !== facility) return false;
      if (category !== 'all' && r.category !== category) return false;
      if (year !== 'all' && String(r.year) !== year) return false;
      if (contractType !== 'all' && r.contractType !== contractType) return false;
      if (lower) {
        const hay = [r.name, r.vendor ?? '', r.contractNo ?? '']
          .join(' ')
          .toLowerCase();
        if (!hay.includes(lower)) return false;
      }
      return true;
    });
  }, [rows, facility, category, year, contractType, q]);

  const summary = useMemo(() => {
    const total = filtered.reduce((s, r) => s + r.amount, 0);
    return {
      count: filtered.length,
      total,
      avg: filtered.length > 0 ? Math.round(total / filtered.length) : 0,
    };
  }, [filtered]);

  function openCreate() {
    setEditorMode('create');
    setEditorId(null);
    setEditorOpen(true);
  }
  function openEdit(id: string) {
    setEditorMode('edit');
    setEditorId(id);
    setEditorOpen(true);
  }

  async function handleQuickDelete(id: string, name: string) {
    if (!confirm(`'${name}' 계약을 삭제하시겠습니까?`)) return;
    const res = await fetch(`/api/maintenance/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error ?? '삭제 실패');
      return;
    }
    router.refresh();
  }

  return (
    <>
      {/* 필터 */}
      <div className="mb-3 flex flex-wrap items-end gap-2">
        <div className="w-44">
          <FilterLabel>시설</FilterLabel>
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
        </div>
        <div className="w-32">
          <FilterLabel>대분류</FilterLabel>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-28">
          <FilterLabel>연도</FilterLabel>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}년
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-28">
          <FilterLabel>계약종류</FilterLabel>
          <Select value={contractType} onValueChange={setContractType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="공사">공사</SelectItem>
              <SelectItem value="용역">용역</SelectItem>
              <SelectItem value="물품">물품</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <FilterLabel>검색</FilterLabel>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-ink-muted" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="계약명 / 업체 / 계약번호"
              className="pl-8"
            />
          </div>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" />
          계약 등록
        </Button>
      </div>

      {/* 집계 */}
      <div className="mb-3 grid grid-cols-3 gap-3 sm:max-w-2xl">
        <SummaryCard label="건수" value={`${fmtNumber(summary.count)}건`} />
        <SummaryCard
          label="합계"
          value={`${fmtBillion(summary.total)}억 원`}
          sub={`${fmtMillion(summary.total)} 백만`}
        />
        <SummaryCard
          label="평균"
          value={`${fmtMillion(summary.avg)} 백만`}
        />
      </div>

      {/* 테이블 */}
      <div className="rounded-lg border border-line bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">계약일</TableHead>
              <TableHead className="w-[110px]">시설</TableHead>
              <TableHead className="w-[80px]">대분류</TableHead>
              <TableHead>계약명</TableHead>
              <TableHead className="w-[140px]">업체</TableHead>
              <TableHead className="w-[60px]">종류</TableHead>
              <TableHead className="w-[110px] text-right">금액</TableHead>
              <TableHead className="w-[160px]">연결 부품</TableHead>
              <TableHead className="w-[40px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="py-12 text-center text-sm text-ink-muted"
                >
                  조건에 맞는 계약이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow
                  key={r.id}
                  onClick={() => openEdit(r.id)}
                  className="cursor-pointer"
                >
                  <TableCell className="text-xs tabular-nums">
                    {fmtDate(r.date)}
                  </TableCell>
                  <TableCell className="text-xs text-ink-muted">
                    {r.facility.name.replace('월성 제', '월성')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={CATEGORY_VARIANT[r.category] ?? 'secondary'}>
                      {r.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-ink-muted">{r.subcategory}</div>
                  </TableCell>
                  <TableCell className="text-xs text-ink-muted">
                    {r.vendor ?? '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={CONTRACT_VARIANT[r.contractType] ?? 'outline'}>
                      {r.contractType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {fmtNumber(r.amount)}
                  </TableCell>
                  <TableCell className="text-xs">
                    {r.part ? (
                      <span className="truncate text-accent">
                        🔗 {r.part.partName}
                      </span>
                    ) : (
                      <span className="text-ink-muted">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickDelete(r.id, r.name);
                      }}
                      className="rounded p-1 text-ink-muted hover:bg-red-50 hover:text-red-700"
                      aria-label="삭제"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <MaintenanceEditorDialog
        mode={editorMode}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        facilities={facilities}
        maintenanceId={editorId}
      />
    </>
  );
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1 text-[11px] font-medium text-ink-muted">{children}</p>
  );
}

function SummaryCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-white p-3">
      <p className="text-[11px] text-ink-muted">{label}</p>
      <p className="mt-0.5 text-base font-bold tabular-nums text-ink">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-ink-muted">{sub}</p>}
    </div>
  );
}
