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
import { fmtDate } from '@/lib/format';

type Facility = { id: string; name: string };

type EquipmentForm = {
  facilityId: string;
  category: Category | '';
  subcategory: string;
  name: string;
  model: string;
  vendor: string;
  installDate: string;
  lifeYears: string;
  lastMaintDate: string;
  status: 'good' | 'warn' | 'bad';
  remark: string;
};

const EMPTY_FORM: EquipmentForm = {
  facilityId: '',
  category: '',
  subcategory: '',
  name: '',
  model: '',
  vendor: '',
  installDate: '',
  lifeYears: '',
  lastMaintDate: '',
  status: 'good',
  remark: '',
};

type Props = {
  mode: 'create' | 'edit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilities: Facility[];
  equipmentId?: string | null;
};

export function EquipmentEditorDialog({
  mode,
  open,
  onOpenChange,
  facilities,
  equipmentId,
}: Props) {
  const router = useRouter();
  const [form, setForm] = useState<EquipmentForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subOptions = useMemo(
    () => (form.category ? SUBCATEGORIES[form.category] : []),
    [form.category],
  );

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (mode === 'edit' && equipmentId) {
      fetch(`/api/equipment/${equipmentId}`)
        .then(async (r) => {
          const j = await r.json();
          if (!r.ok) throw new Error(j.error ?? '조회 실패');
          const eq = j.equipment;
          setForm({
            facilityId: eq.facilityId,
            category: eq.category,
            subcategory: eq.subcategory,
            name: eq.name,
            model: eq.model ?? '',
            vendor: eq.vendor ?? '',
            installDate: fmtDate(eq.installDate) === '-' ? '' : fmtDate(eq.installDate),
            lifeYears: eq.lifeYears != null ? String(eq.lifeYears) : '',
            lastMaintDate:
              fmtDate(eq.lastMaintDate) === '-' ? '' : fmtDate(eq.lastMaintDate),
            status: eq.status,
            remark: eq.remark ?? '',
          });
        })
        .catch((err) => setError(err.message));
    } else {
      setForm(EMPTY_FORM);
    }
  }, [mode, equipmentId, open]);

  function update<K extends keyof EquipmentForm>(
    key: K,
    value: EquipmentForm[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.facilityId) return setError('시설을 선택해주세요.');
    if (!form.category) return setError('대분류를 선택해주세요.');
    if (!form.subcategory) return setError('세부구분을 선택해주세요.');
    if (!form.name.trim()) return setError('설비명을 입력해주세요.');

    setSubmitting(true);
    try {
      const url =
        mode === 'edit' && equipmentId
          ? `/api/equipment/${equipmentId}`
          : '/api/equipment';
      const method = mode === 'edit' ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
    if (!equipmentId) return;
    if (!confirm('이 설비를 삭제하시겠습니까? 연결된 부품·정비이력은 유지됩니다.')) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/equipment/${equipmentId}`, {
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
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? '설비 편집' : '설비 등록'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="시설" required>
              <Select
                value={form.facilityId}
                onValueChange={(v) => update('facilityId', v)}
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
            <Field label="상태">
              <Select
                value={form.status}
                onValueChange={(v) =>
                  update('status', v as 'good' | 'warn' | 'bad')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="good">정상</SelectItem>
                  <SelectItem value="warn">주의</SelectItem>
                  <SelectItem value="bad">위험</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="설비명" required>
            <Input
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="예: 월성2 전동펌프 4호기"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="모델·규격">
              <Input
                value={form.model}
                onChange={(e) => update('model', e.target.value)}
              />
            </Field>
            <Field label="제조사">
              <Input
                value={form.vendor}
                onChange={(e) => update('vendor', e.target.value)}
              />
            </Field>
            <Field label="설치일">
              <Input
                type="date"
                value={form.installDate}
                onChange={(e) => update('installDate', e.target.value)}
              />
            </Field>
            <Field label="내용연수(년)">
              <Input
                type="number"
                min={0}
                value={form.lifeYears}
                onChange={(e) => update('lifeYears', e.target.value)}
              />
            </Field>
            <Field label="최근 정비일">
              <Input
                type="date"
                value={form.lastMaintDate}
                onChange={(e) => update('lastMaintDate', e.target.value)}
              />
            </Field>
          </div>

          <Field label="비고">
            <Textarea
              value={form.remark}
              onChange={(e) => update('remark', e.target.value)}
              rows={2}
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
