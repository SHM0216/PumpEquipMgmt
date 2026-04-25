import { z } from 'zod';
import { CATEGORIES } from '@/lib/constants';

const isoDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/u, 'YYYY-MM-DD 형식이어야 합니다.')
  .optional()
  .or(z.literal(''));

export const equipmentCreateSchema = z.object({
  facilityId: z.string().min(1, '시설을 선택해주세요.'),
  category: z.enum(CATEGORIES, { errorMap: () => ({ message: '대분류를 선택해주세요.' }) }),
  subcategory: z.string().min(1, '세부구분을 입력해주세요.'),
  name: z.string().min(1, '설비명을 입력해주세요.'),
  model: z.string().optional().or(z.literal('')),
  vendor: z.string().optional().or(z.literal('')),
  installDate: isoDate,
  lifeYears: z
    .union([z.number().int().nonnegative(), z.string().regex(/^\d+$/u)])
    .optional()
    .or(z.literal('')),
  lastMaintDate: isoDate,
  status: z.enum(['good', 'warn', 'bad']).default('good'),
  remark: z.string().optional().or(z.literal('')),
});

export type EquipmentCreateInput = z.infer<typeof equipmentCreateSchema>;

export const equipmentUpdateSchema = equipmentCreateSchema.partial();
export type EquipmentUpdateInput = z.infer<typeof equipmentUpdateSchema>;

export const equipmentFilterSchema = z.object({
  facilityId: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  q: z.string().optional(),
});
export type EquipmentFilter = z.infer<typeof equipmentFilterSchema>;
