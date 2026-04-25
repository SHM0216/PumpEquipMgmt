import { z } from 'zod';
import { CATEGORIES } from '@/lib/constants';

const isoDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/u, 'YYYY-MM-DD 형식이어야 합니다.');

export const maintenanceCreateSchema = z.object({
  date: isoDate,
  facilityId: z.string().min(1, '시설을 선택해주세요.'),
  equipmentId: z.string().optional().nullable().or(z.literal('')),
  partId: z.string().optional().nullable().or(z.literal('')),
  category: z.enum(CATEGORIES, {
    errorMap: () => ({ message: '대분류를 선택해주세요.' }),
  }),
  subcategory: z.string().min(1, '세부구분을 입력해주세요.'),
  name: z.string().min(1, '계약명을 입력해주세요.'),
  vendor: z.string().optional().nullable().or(z.literal('')),
  amount: z
    .union([z.number().nonnegative(), z.string().regex(/^\d+$/u)])
    .transform((v) => (typeof v === 'string' ? Number(v) : v)),
  contractType: z.enum(['공사', '용역', '물품'], {
    errorMap: () => ({ message: '계약종류를 선택해주세요.' }),
  }),
  contractNo: z.string().optional().nullable().or(z.literal('')),
  description: z.string().optional().nullable().or(z.literal('')),
});

export type MaintenanceCreateInput = z.infer<typeof maintenanceCreateSchema>;
export const maintenanceUpdateSchema = maintenanceCreateSchema.partial();
export type MaintenanceUpdateInput = z.infer<typeof maintenanceUpdateSchema>;
