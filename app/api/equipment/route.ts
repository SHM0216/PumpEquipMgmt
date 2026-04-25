import { NextResponse, type NextRequest } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import {
  equipmentCreateSchema,
  equipmentFilterSchema,
} from '@/lib/validators/equipment';

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = equipmentFilterSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: '잘못된 필터 조건입니다.', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { facilityId, category, status, q } = parsed.data;
  const where: Prisma.EquipmentWhereInput = {};
  if (facilityId && facilityId !== 'all') where.facilityId = facilityId;
  if (category && category !== 'all') where.category = category;
  if (status && status !== 'all') where.status = status;
  if (q && q.trim().length > 0) {
    where.OR = [
      { name: { contains: q } },
      { model: { contains: q } },
      { vendor: { contains: q } },
    ];
  }

  const equipment = await prisma.equipment.findMany({
    where,
    include: {
      facility: { select: { id: true, name: true } },
      _count: { select: { parts: true, maintenance: true } },
    },
    orderBy: [{ facilityId: 'asc' }, { category: 'asc' }, { name: 'asc' }],
  });

  return NextResponse.json({ equipment });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'JSON 본문을 파싱할 수 없습니다.' },
      { status: 400 },
    );
  }

  const parsed = equipmentCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: '입력값이 올바르지 않습니다.', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const d = parsed.data;
  try {
    const created = await prisma.equipment.create({
      data: {
        facilityId: d.facilityId,
        category: d.category,
        subcategory: d.subcategory,
        name: d.name,
        model: d.model || null,
        vendor: d.vendor || null,
        installDate: d.installDate ? new Date(d.installDate) : null,
        lifeYears:
          d.lifeYears === '' || d.lifeYears === undefined
            ? null
            : Number(d.lifeYears),
        lastMaintDate: d.lastMaintDate ? new Date(d.lastMaintDate) : null,
        status: d.status,
        remark: d.remark || null,
      },
    });
    return NextResponse.json({ equipment: created }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/equipment]', err);
    return NextResponse.json(
      { error: '설비 생성 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
