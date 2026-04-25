import { z } from 'zod';
import { PART_STATUS_KEYS } from '@/lib/part-constants';

export const partCreateSchema = z.object({
  facilityCode: z.string().min(1, '시설 코드를 입력해주세요.'),
  facilityLabel: z.string().min(1, '시설 라벨을 입력해주세요.'),
  equipmentGroup: z.string().min(1, '대분류를 입력해주세요.'),
  equipmentId: z.string().nullable().optional(),
  partName: z.string().min(1, '부품명을 입력해주세요.'),
  spec: z.string().nullable().optional(),
  history: z.string().nullable().optional(),
  cycle: z.string().nullable().optional(),
  cycleMonths: z.number().int().nullable().optional(),
  nextTime: z.string().nullable().optional(),
  nextYear: z.number().int().nullable().optional(),
  status: z.enum(PART_STATUS_KEYS as [string, ...string[]]),
  statusLabel: z.string().nullable().optional(),
  overdue: z.boolean().optional(),
  isNew: z.boolean().optional(),
  note: z.string().nullable().optional(),
});

export type PartCreateInput = z.infer<typeof partCreateSchema>;
export const partUpdateSchema = partCreateSchema.partial();
export type PartUpdateInput = z.infer<typeof partUpdateSchema>;
