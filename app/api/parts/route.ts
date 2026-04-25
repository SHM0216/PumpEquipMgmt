import { NextResponse, type NextRequest } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { partCreateSchema } from '@/lib/validators/part';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const facilityCode = searchParams.get('facilityCode');
  const equipmentGroup = searchParams.get('equipmentGroup');
  const status = searchParams.get('status');
  const q = searchParams.get('q');

  const where: Prisma.PartWhereInput = {};
  if (facilityCode && facilityCode !== 'all') where.facilityCode = facilityCode;
  if (equipmentGroup && equipmentGroup !== 'all')
    where.equipmentGroup = equipmentGroup;
  if (status && status !== 'all') where.status = status;
  if (q && q.trim().length > 0) {
    where.OR = [
      { partName: { contains: q } },
      { spec: { contains: q } },
      { history: { contains: q } },
    ];
  }

  const parts = await prisma.part.findMany({
    where,
    orderBy: [
      { facilityLabel: 'asc' },
      { equipmentGroup: 'asc' },
      { partName: 'asc' },
    ],
  });
  return NextResponse.json({ parts });
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

  const parsed = partCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: '입력값이 올바르지 않습니다.', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const created = await prisma.part.create({ data: parsed.data });
    return NextResponse.json({ part: created }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/parts]', err);
    return NextResponse.json(
      { error: '부품 생성 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
