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
import {
  EQUIPMENT_GROUPS,
  PART_STATUS,
  PART_STATUS_KEYS,
} from '@/lib/part-constants';
import { PartStatusBadge } from './PartStatusBadge';
import { PartDetailDialog } from './PartDetailDialog';
import { PartEditorDialog } from './PartEditorDialog';

export type PartRow = {
  id: string;
  facilityCode: string;
  facilityLabel: string;
  equipmentGroup: string;
  partName: string;
  spec: string | null;
  history: string | null;
  cycle: string | null;
  nextTime: string | null;
  nextYear: number | null;
  status: string;
  statusLabel: string | null;
};

const FACILITY_OPTIONS = [
  { code: 'ws1', label: '월성1' },
  { code: 'ws2', label: '월성2' },
  { code: 'ws3', label: '월성3' },
  { code: 'ws-daemyeong', label: '대명유수지' },
  { code: 'ws-common', label: '월성공통' },
];

export function PartsList({ rows }: { rows: PartRow[] }) {
  const [facility, setFacility] = useState('all');
  const [group, setGroup] = useState('all');
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [editorPartId, setEditorPartId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const lower = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (facility !== 'all' && r.facilityCode !== facility) return false;
      if (group !== 'all' && r.equipmentGroup !== group) return false;
      if (status !== 'all' && r.status !== status) return false;
      if (lower) {
        const hay = [r.partName, r.spec ?? '', r.history ?? '']
          .join(' ')
          .toLowerCase();
        if (!hay.includes(lower)) return false;
      }
      return true;
    });
  }, [rows, facility, group, status, q]);

  function openDetail(id: string) {
    setDetailId(id);
    setDetailOpen(true);
  }
  function openCreate() {
    setEditorMode('create');
    setEditorPartId(null);
    setEditorOpen(true);
  }
  function openEdit(id: string) {
    setEditorMode('edit');
    setEditorPartId(id);
    setDetailOpen(false);
    setEditorOpen(true);
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap items-end gap-2">
        <div className="w-36">
          <Filter label="시설">
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
          </Filter>
        </div>
        <div className="w-32">
          <Filter label="대분류">
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
          </Filter>
        </div>
        <div className="w-36">
          <Filter label="상태">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                {PART_STATUS_KEYS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {PART_STATUS[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Filter>
        </div>
        <div className="flex-1 min-w-[200px]">
          <Filter label="검색">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-ink-muted" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="부품명 / 규격 / 이력"
                className="pl-8"
              />
            </div>
          </Filter>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" />
          부품 등록
        </Button>
      </div>

      <p className="mb-2 text-xs text-ink-muted">
        총 <strong className="text-ink">{filtered.length.toLocaleString('ko-KR')}</strong>건
        {filtered.length !== rows.length &&
          ` (전체 ${rows.length.toLocaleString('ko-KR')}건 중)`}
      </p>

      <div className="rounded-lg border border-line bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[90px]">시설</TableHead>
              <TableHead className="w-[80px]">대분류</TableHead>
              <TableHead>부품/작업</TableHead>
              <TableHead className="w-[180px]">규격·수량</TableHead>
              <TableHead className="w-[80px]">주기</TableHead>
              <TableHead className="w-[100px]">차기시기</TableHead>
              <TableHead className="w-[110px]">상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-sm text-ink-muted"
                >
                  조건에 맞는 부품이 없습니다.
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
                    {r.facilityLabel}
                  </TableCell>
                  <TableCell className="text-xs">{r.equipmentGroup}</TableCell>
                  <TableCell>
                    <div className="font-medium">{r.partName}</div>
                  </TableCell>
                  <TableCell className="text-xs text-ink-muted">
                    {r.spec ?? '-'}
                  </TableCell>
                  <TableCell className="text-xs">{r.cycle ?? '-'}</TableCell>
                  <TableCell className="text-xs tabular-nums">
                    {r.nextTime ?? (r.nextYear ? `${r.nextYear}년` : '-')}
                  </TableCell>
                  <TableCell>
                    <PartStatusBadge
                      status={r.status}
                      statusLabel={r.statusLabel}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PartDetailDialog
        partId={detailId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={openEdit}
      />
      <PartEditorDialog
        mode={editorMode}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        partId={editorPartId}
      />
    </>
  );
}

function Filter({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-medium text-ink-muted">{label}</p>
      {children}
    </div>
  );
}
