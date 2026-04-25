'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CATEGORIES, SUBCATEGORIES, type Category } from '@/lib/constants';
import { PartStatusBadge } from '@/components/domain/parts/PartStatusBadge';

const FACILITY_TO_PART_CODE: Record<string, string> = {
  ws1: 'ws1',
  ws2: 'ws2',
  ws3: 'ws3',
  'ws-daemyeong': 'ws-daemyeong',
  'ws-common': 'ws-common',
};

type Facility = { id: string; name: string };
type PartCandidate = {
  id: string;
  partName: string;
  spec: string | null;
  status: string;
  statusLabel: string | null;
};

type Form = {
  date: string;
  facilityId: string;
  category: Category | '';
  subcategory: string;
  name: string;
  vendor: string;
  amount: string;
  contractType: '' | '공사' | '용역' | '물품';
  contractNo: string;
  partId: string;
  description: string;
};

const EMPTY: Form = {
  date: new Date().toISOString().slice(0, 10),
  facilityId: '',
  category: '',
  subcategory: '',
  name: '',
  vendor: '',
  amount: '',
  contractType: '',
  contractNo: '',
  partId: '',
  description: '',
};

const NO_PART_VALUE = '__none__';

type Props = {
  mode: 'create' | 'edit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilities: Facility[];
  maintenanceId?: string | null;
};

export function MaintenanceEditorDialog({
  mode,
  open,
  onOpenChange,
  facilities,
  maintenanceId,
}: Props) {
  const router = useRouter();
  const [form, setForm] = useState<Form>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parts, setParts] = useState<PartCandidate[]>([]);
  const [partsLoading, setPartsLoading] = useState(false);

  const subOptions = useMemo(
    () => (form.category ? SUBCATEGORIES[form.category] : []),
    [form.category],
  );

  // 시설+대분류로 Part 자동 추천
  useEffect(() => {
    if (!open) return;
    const partCode = FACILITY_TO_PART_CODE[form.facilityId];
    if (!partCode || !form.category) {
      setParts([]);
      return;
    }
    let cancelled = false;
    setPartsLoading(true);
    fetch(
      `/api/parts?facilityCode=${encodeURIComponent(partCode)}&equipmentGroup=${encodeURIComponent(form.category)}`,
    )
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        setParts(j.parts ?? []);
      })
      .catch(() => {
        if (!cancelled) setParts([]);
      })
      .finally(() => {
        if (!cancelled) setPartsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [form.facilityId, form.category, open]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (mode === 'edit' && maintenanceId) {
      fetch(`/api/maintenance/${maintenanceId}`)
        .then(async (r) => {
          const j = await r.json();
          if (!r.ok) throw new Error(j.error ?? '조회 실패');
          const m = j.item;
          setForm({
            date: m.date ? new Date(m.date).toISOString().slice(0, 10) : '',
            facilityId: m.facilityId,
            category: m.category,
            subcategory: m.subcategory,
            name: m.name,
            vendor: m.vendor ?? '',
            amount: String(m.amount ?? ''),
            contractType: m.contractType,
            contractNo: m.contractNo ?? '',
            partId: m.partId ?? '',
            description: m.description ?? '',
          });
        })
        .catch((err) => setError(err.message));
    } else {
      setForm(EMPTY);
    }
  }, [mode, maintenanceId, open]);

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.date) return setError('계약일을 입력해주세요.');
    if (!form.facilityId) return setError('시설을 선택해주세요.');
    if (!form.category) return setError('대분류를 선택해주세요.');
    if (!form.subcategory) return setError('세부구분을 선택해주세요.');
    if (!form.name.trim()) return setError('계약명을 입력해주세요.');
    if (!form.contractType) return setError('계약종류를 선택해주세요.');
    if (form.amount === '') return setError('금액을 입력해주세요.');

    setSubmitting(true);
    try {
      const url =
        mode === 'edit' && maintenanceId
          ? `/api/maintenance/${maintenanceId}`
          : '/api/maintenance';
      const method = mode === 'edit' ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
          partId: form.partId === NO_PART_VALUE ? '' : form.partId,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? '저장 실패');
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!maintenanceId) return;
    if (!confirm('이 계약을 삭제하시겠습니까?')) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/maintenance/${maintenanceId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? '삭제 실패');
      }
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? '계약 편집' : '계약 등록'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="계약일" required>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => update('date', e.target.value)}
              />
            </Field>
            <Field label="계약종류" required>
              <Select
                value={form.contractType}
                onValueChange={(v) =>
                  update('contractType', v as Form['contractType'])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="공사">공사</SelectItem>
                  <SelectItem value="용역">용역</SelectItem>
                  <SelectItem value="물품">물품</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="시설" required>
              <Select
                value={form.facilityId}
                onValueChange={(v) => {
                  update('facilityId', v);
                  update('partId', '');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  {facilities.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="대분류" required>
              <Select
                value={form.category}
                onValueChange={(v) => {
                  update('category', v as Category);
                  update('subcategory', '');
                  update('partId', '');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="세부구분" required>
              <Select
                value={form.subcategory}
                onValueChange={(v) => update('subcategory', v)}
                disabled={!form.category}
              >
                <SelectTrigger>
                  <SelectValue placeholder={form.category ? '선택' : '대분류 먼저'} />
                </SelectTrigger>
                <SelectContent>
                  {subOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="금액 (원)" required>
              <Input
                type="number"
                min={0}
                value={form.amount}
                onChange={(e) => update('amount', e.target.value)}
              />
            </Field>
          </div>

          <Field label="계약명" required>
            <Input
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="예: 월성2 전동펌프 4호기 오버홀공사"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="시공/공급 업체">
              <Input
                value={form.vendor}
                onChange={(e) => update('vendor', e.target.value)}
              />
            </Field>
            <Field label="계약번호">
              <Input
                value={form.contractNo}
                onChange={(e) => update('contractNo', e.target.value)}
              />
            </Field>
          </div>

          {/* Part 자동 추천 */}
          <Field label="연결 부품 (선택)">
            <div>
              <Select
                value={form.partId || ''}
                onValueChange={(v) => update('partId', v === NO_PART_VALUE ? '' : v)}
                disabled={!form.facilityId || !form.category}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !form.facilityId || !form.category
                        ? '시설·대분류 먼저 선택'
                        : partsLoading
                          ? '추천 부품 검색 중…'
                          : parts.length === 0
                            ? '추천 부품 없음 — 연결 안 함'
                            : '부품 선택 또는 비워두기'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PART_VALUE}>— 부품 연결 안 함 —</SelectItem>
                  {parts.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.partName}
                      {p.spec ? ` · ${p.spec}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.partId && form.partId !== NO_PART_VALUE && (
                <div className="mt-1.5 flex items-center gap-2 text-xs text-ink-muted">
                  {(() => {
                    const sel = parts.find((p) => p.id === form.partId);
                    if (!sel) return <span>선택된 부품 (확인 중…)</span>;
                    return (
                      <>
                        <PartStatusBadge
                          status={sel.status}
                          statusLabel={sel.statusLabel}
                        />
                        <span className="truncate">{sel.partName}</span>
                      </>
                    );
                  })()}
                </div>
              )}
              {!form.facilityId || !form.category ? null : parts.length > 0 && (
                <p className="mt-1 text-[11px] text-ink-muted">
                  💡 추천 부품 {parts.length}건 — 같은 시설·대분류에서 자동 추출
                </p>
              )}
            </div>
          </Field>

          <Field label="설명">
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
            />
          </Field>

          {error && (
            <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}

          <DialogFooter>
            {mode === 'edit' && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={submitting}
                className="sm:mr-auto"
              >
                삭제
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              취소
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? '저장 중…' : mode === 'edit' ? '수정' : '등록'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-ink-muted">
        {label}
        {required && <span className="ml-0.5 text-red-600">*</span>}
      </Label>
      {children}
    </div>
  );
}

