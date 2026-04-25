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

type Facility = { id: string; name: string };

type Form = {
  date: string;
  facilityId: string;
  inspType: '' | '일일' | '주간' | '월간' | '정밀안전' | '수시';
  target: string;
  result: '' | '정상' | '지적' | '위험';
  inspector: string;
  memo: string;
};

const EMPTY: Form = {
  date: new Date().toISOString().slice(0, 10),
  facilityId: '',
  inspType: '',
  target: '',
  result: '',
  inspector: '',
  memo: '',
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilities: Facility[];
};

export function InspectionEditorDialog({
  open,
  onOpenChange,
  facilities,
}: Props) {
  const router = useRouter();
  const [form, setForm] = useState<Form>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setError(null);
    }
  }, [open]);

  function update<K extends keyof Form>(k: K, v: Form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.date) return setError('점검일을 입력해주세요.');
    if (!form.facilityId) return setError('시설을 선택해주세요.');
    if (!form.inspType) return setError('점검 유형을 선택해주세요.');
    if (!form.target.trim()) return setError('점검 대상을 입력해주세요.');
    if (!form.result) return setError('결과를 선택해주세요.');
    setSubmitting(true);
    try {
      const res = await fetch('/api/inspections', {
        method: 'POST',
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>점검 등록</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="점검일" required>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => update('date', e.target.value)}
              />
            </Field>
            <Field label="유형" required>
              <Select
                value={form.inspType}
                onValueChange={(v) => update('inspType', v as Form['inspType'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="일일">일일</SelectItem>
                  <SelectItem value="주간">주간</SelectItem>
                  <SelectItem value="월간">월간</SelectItem>
                  <SelectItem value="정밀안전">정밀안전</SelectItem>
                  <SelectItem value="수시">수시</SelectItem>
                </SelectContent>
              </Select>
            </Field>
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
            <Field label="결과" required>
              <Select
                value={form.result}
                onValueChange={(v) => update('result', v as Form['result'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="정상">정상</SelectItem>
                  <SelectItem value="지적">지적</SelectItem>
                  <SelectItem value="위험">위험</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="점검 대상" required>
            <Input
              value={form.target}
              onChange={(e) => update('target', e.target.value)}
              placeholder="예: 전동펌프 4호기 외관 / 154KV 수전반 등"
            />
          </Field>
          <Field label="점검자">
            <Input
              value={form.inspector}
              onChange={(e) => update('inspector', e.target.value)}
              placeholder="이름 또는 부서"
            />
          </Field>
          <Field label="점검 내용·지적사항">
            <Textarea
              rows={3}
              value={form.memo}
              onChange={(e) => update('memo', e.target.value)}
            />
          </Field>

          {error && (
            <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              취소
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? '저장 중…' : '등록'}
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
