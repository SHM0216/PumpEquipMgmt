import { z } from 'zod';

export const inspectionCreateSchema = z.object({
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/u, 'YYYY-MM-DD 형식이어야 합니다.'),
  facilityId: z.string().min(1, '시설을 선택해주세요.'),
  equipmentId: z.string().optional().nullable().or(z.literal('')),
  partId: z.string().optional().nullable().or(z.literal('')),
  inspType: z.enum(['일일', '주간', '월간', '정밀안전', '수시'], {
    errorMap: () => ({ message: '점검 유형을 선택해주세요.' }),
  }),
  target: z.string().min(1, '점검 대상을 입력해주세요.'),
  result: z.enum(['정상', '지적', '위험'], {
    errorMap: () => ({ message: '결과를 선택해주세요.' }),
  }),
  memo: z.string().optional().nullable().or(z.literal('')),
  inspector: z.string().optional().nullable().or(z.literal('')),
});

export type InspectionCreateInput = z.infer<typeof inspectionCreateSchema>;
export const inspectionUpdateSchema = inspectionCreateSchema.partial();
