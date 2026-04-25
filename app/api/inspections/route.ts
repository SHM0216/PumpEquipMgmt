import { NextResponse, type NextRequest } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { inspectionCreateSchema } from '@/lib/validators/inspection';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const facilityId = searchParams.get('facilityId');
  const inspType = searchParams.get('inspType');
  const result = searchParams.get('result');

  const where: Prisma.InspectionWhereInput = {};
  if (facilityId && facilityId !== 'all') where.facilityId = facilityId;
  if (inspType && inspType !== 'all') where.inspType = inspType;
  if (result && result !== 'all') where.result = result;

  const items = await prisma.inspection.findMany({
    where,
    include: { facility: { select: { id: true, name: true } } },
    orderBy: [{ date: 'desc' }, { id: 'asc' }],
  });
  return NextResponse.json({ items });
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
  const parsed = inspectionCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: '입력값이 올바르지 않습니다.', issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const d = parsed.data;
  try {
    const created = await prisma.inspection.create({
      data: {
        date: new Date(d.date),
        facilityId: d.facilityId,
        equipmentId: d.equipmentId || null,
        partId: d.partId || null,
        inspType: d.inspType,
        target: d.target,
        result: d.result,
        memo: d.memo || null,
        inspector: d.inspector || null,
      },
    });
    return NextResponse.json({ item: created }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/inspections]', err);
    return NextResponse.json(
      { error: '점검 등록 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
