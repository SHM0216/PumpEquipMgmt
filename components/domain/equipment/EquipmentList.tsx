'use client';

import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
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
import { fmtDate, elapsedFromInstall } from '@/lib/format';
import { CATEGORIES } from '@/lib/constants';
import { EquipmentCardDialog } from './EquipmentCardDialog';
import { EquipmentEditorDialog } from './EquipmentEditorDialog';

export type EquipmentRow = {
  id: string;
  name: string;
  facilityId: string;
  facility: { id: string; name: string };
  category: string;
  subcategory: string;
  model: string | null;
  vendor: string | null;
  installDate: string | null;
  lifeYears: number | null;
  lastMaintDate: string | null;
  status: string;
  _count: { parts: number; maintenance: number };
};

type Facility = { id: string; name: string };

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

export function EquipmentList({
  rows,
  facilities,
}: {
  rows: EquipmentRow[];
  facilities: Facility[];
}) {
  const [facilityFilter, setFacilityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [q, setQ] = useState('');

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [editorEquipmentId, setEditorEquipmentId] = useState<string | null>(
    null,
  );

  const filtered = useMemo(() => {
    const lower = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (facilityFilter !== 'all' && r.facilityId !== facilityFilter)
        return false;
      if (categoryFilter !== 'all' && r.category !== categoryFilter)
        return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (lower) {
        const hay = [r.name, r.model ?? '', r.vendor ?? '', r.subcategory]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(lower)) return false;
      }
      return true;
    });
  }, [rows, facilityFilter, categoryFilter, statusFilter, q]);

  function openDetail(id: string) {
    setDetailId(id);
    setDetailOpen(true);
  }

  function openCreate() {
    setEditorMode('create');
    setEditorEquipmentId(null);
    setEditorOpen(true);
  }

  function openEdit(id: string) {
    setEditorMode('edit');
    setEditorEquipmentId(id);
    setDetailOpen(false);
    setEditorOpen(true);
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap items-end gap-2">
        <div className="w-44">
          <FilterLabel>시설</FilterLabel>
          <Select value={facilityFilter} onValueChange={setFacilityFilter}>
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
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
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
          <FilterLabel>상태</FilterLabel>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="good">정상</SelectItem>
              <SelectItem value="warn">주의</SelectItem>
              <SelectItem value="bad">위험</SelectItem>
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
              placeholder="설비명 / 모델 / 제조사"
              className="pl-8"
            />
          </div>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" />
          설비 등록
        </Button>
      </div>

      <p className="mb-2 text-xs text-ink-muted">
        총 <strong className="text-ink">{filtered.length.toLocaleString('ko-KR')}</strong>건
        {filtered.length !== rows.length && ` (전체 ${rows.length.toLocaleString('ko-KR')}건 중)`}
      </p>

      <div className="rounded-lg border border-line bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">시설</TableHead>
              <TableHead className="w-[80px]">대분류</TableHead>
              <TableHead>설비명</TableHead>
              <TableHead className="w-[200px]">모델·사양</TableHead>
              <TableHead className="w-[100px]">설치일</TableHead>
              <TableHead className="w-[80px]">경과</TableHead>
              <TableHead className="w-[100px]">최근정비</TableHead>
              <TableHead className="w-[70px]">상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-12 text-center text-sm text-ink-muted"
                >
                  조건에 맞는 설비가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow
                  key={r.id}
                  onClick={() => openDetail(r.id)}
                  className="cursor-pointer"
                >
                  <TableCell className="text-xs text-ink-muted">
                    {r.facility.name.replace('월성 제', '월성')}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={CATEGORY_VARIANT[r.category] ?? 'secondary'}
                    >
                      {r.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-ink-muted">{r.subcategory}</div>
                  </TableCell>
                  <TableCell className="text-xs text-ink-muted">
                    {[r.model, r.vendor].filter(Boolean).join(' / ') || '-'}
                  </TableCell>
                  <TableCell className="text-xs tabular-nums">
                    {fmtDate(r.installDate)}
                  </TableCell>
                  <TableCell className="text-xs">
                    {elapsedFromInstall(r.installDate)}
                  </TableCell>
                  <TableCell className="text-xs tabular-nums">
                    {fmtDate(r.lastMaintDate)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={STATUS_VARIANT[r.status] ?? 'secondary'}
                    >
                      {STATUS_LABEL[r.status] ?? r.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <EquipmentCardDialog
        equipmentId={detailId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={openEdit}
      />
      <EquipmentEditorDialog
        mode={editorMode}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        facilities={facilities}
        equipmentId={editorEquipmentId}
      />
    </>
  );
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1 text-[11px] font-medium text-ink-muted">{children}</p>
  );
}
