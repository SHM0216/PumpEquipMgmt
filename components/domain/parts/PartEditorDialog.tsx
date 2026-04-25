'use client';

import { useEffect, useState } from 'react';
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
import {
  EQUIPMENT_GROUPS,
  PART_STATUS,
  PART_STATUS_KEYS,
  type PartStatus,
} from '@/lib/part-constants';

const FACILITY_OPTIONS: Array<{ code: string; label: string }> = [
  { code: 'ws1', label: '월성1' },
  { code: 'ws2', label: '월성2' },
  { code: 'ws3', label: '월성3' },
  { code: 'ws-daemyeong', label: '대명유수지' },
  { code: 'ws-common', label: '월성공통' },
];

type PartForm = {
  facilityCode: string;
  facilityLabel: string;
  equipmentGroup: string;
  partName: string;
  spec: string;
  history: string;
  cycle: string;
  cycleMonths: string;
  nextTime: string;
  nextYear: string;
  status: PartStatus;
  note: string;
};

const EMPTY: PartForm = {
  facilityCode: '',
  facilityLabel: '',
  equipmentGroup: '',
  partName: '',
  spec: '',
  history: '',
  cycle: '',
  cycleMonths: '',
  nextTime: '',
  nextYear: '',
  status: 'normal',
  note: '',
};

type Props = {
  mode: 'create' | 'edit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partId?: string | null;
};

export function PartEditorDialog({ mode, open, onOpenChange, partId }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<PartForm>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (mode === 'edit' && partId) {
      fetch(`/api/parts/${partId}`)
        .then(async (r) => {
          const j = await r.json();
          if (!r.ok) throw new Error(j.error ?? '조회 실패');
          const p = j.part;
          setForm({
            facilityCode: p.facilityCode,
            facilityLabel: p.facilityLabel,
            equipmentGroup: p.equipmentGroup,
            partName: p.partName,
            spec: p.spec ?? '',
            history: p.history ?? '',
            cycle: p.cycle ?? '',
            cycleMonths: p.cycleMonths != null ? String(p.cycleMonths) : '',
            nextTime: p.nextTime ?? '',
            nextYear: p.nextYear != null ? String(p.nextYear) : '',
            status: p.status,
            note: p.note ?? '',
          });
        })
        .catch((err) => setError(err.message));
    } else {
      setForm(EMPTY);
    }
  }, [mode, partId, open]);

  function update<K extends keyof PartForm>(key: K, value: PartForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.facilityCode) return setError('시설을 선택해주세요.');
    if (!form.equipmentGroup) return setError('대분류를 선택해주세요.');
    if (!form.partName.trim()) return setError('부품명을 입력해주세요.');

    setSubmitting(true);
    try {
      const payload = {
        facilityCode: form.facilityCode,
        facilityLabel: form.facilityLabel,
        equipmentGroup: form.equipmentGroup,
        partName: form.partName.trim(),
        spec: form.spec.trim() || null,
        history: form.history.trim() || null,
        cycle: form.cycle.trim() || null,
        cycleMonths: form.cycleMonths ? Number(form.cycleMonths) : null,
        nextTime: form.nextTime.trim() || null,
        nextYear: form.nextYear ? Number(form.nextYear) : null,
        status: form.status,
        statusLabel: PART_STATUS[form.status].label,
        overdue: form.status === 'overdue',
        isNew: form.status === 'new',
        note: form.note.trim() || null,
      };
      const url =
        mode === 'edit' && partId ? `/api/parts/${partId}` : '/api/parts';
      const method = mode === 'edit' ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
    if (!partId) return;
    if (!confirm('이 부품을 삭제하시겠습니까? 타임라인 이벤트도 함께 삭제됩니다.'))
      return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/parts/${partId}`, { method: 'DELETE' });
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
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? '부품 편집' : '부품 등록'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="시설" required>
              <Select
                value={form.facilityCode}
                onValueChange={(v) => {
                  const opt = FACILITY_OPTIONS.find((f) => f.code === v);
                  update('facilityCode', v);
                  update('facilityLabel', opt?.label ?? '');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  {FACILITY_OPTIONS.map((f) => (
                    <SelectItem key={f.code} value={f.code}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="대분류" required>
              <Select
                value={form.equipmentGroup}
                onValueChange={(v) => update('equipmentGroup', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  {EQUIPMENT_GROUPS.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="부품/작업명" required>
            <Input
              value={form.partName}
              onChange={(e) => update('partName', e.target.value)}
              placeholder="예: 전동펌프 그랜드패킹"
            />
          </Field>
          <Field label="규격·수량">
            <Input
              value={form.spec}
              onChange={(e) => update('spec', e.target.value)}
              placeholder="예: 600㎥/min × 1,750HP"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="주기">
              <Input
                value={form.cycle}
                onChange={(e) => update('cycle', e.target.value)}
                placeholder="예: 3~5년 / 연 1회"
              />
            </Field>
            <Field label="주기(개월)">
              <Input
                type="number"
                value={form.cycleMonths}
                onChange={(e) => update('cycleMonths', e.target.value)}
                placeholder="예: 36"
              />
            </Field>
            <Field label="차기시기">
              <Input
                value={form.nextTime}
                onChange={(e) => update('nextTime', e.target.value)}
                placeholder="예: 2027년"
              />
            </Field>
            <Field label="차기연도">
              <Input
                type="number"
                min={2000}
                max={2100}
                value={form.nextYear}
                onChange={(e) => update('nextYear', e.target.value)}
              />
            </Field>
            <Field label="상태">
              <Select
                value={form.status}
                onValueChange={(v) => update('status', v as PartStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PART_STATUS_KEYS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {PART_STATUS[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="시행 이력 (멀티라인)">
            <Textarea
              rows={3}
              value={form.history}
              onChange={(e) => update('history', e.target.value)}
              placeholder="• 2022: 오버홀 공사 [#42]"
            />
          </Field>
          <Field label="비고">
            <Textarea
              rows={2}
              value={form.note}
              onChange={(e) => update('note', e.target.value)}
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

