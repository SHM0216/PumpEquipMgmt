import { NextResponse, type NextRequest } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { maintenanceCreateSchema } from '@/lib/validators/maintenance';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const facilityId = searchParams.get('facilityId');
  const category = searchParams.get('category');
  const year = searchParams.get('year');
  const contractType = searchParams.get('contractType');
  const partId = searchParams.get('partId');
  const q = searchParams.get('q');

  const where: Prisma.MaintenanceWhereInput = {};
  if (facilityId && facilityId !== 'all') where.facilityId = facilityId;
  if (category && category !== 'all') where.category = category;
  if (year && year !== 'all') where.year = Number(year);
  if (contractType && contractType !== 'all') where.contractType = contractType;
  if (partId) where.partId = partId;
  if (q && q.trim().length > 0) {
    where.OR = [
      { name: { contains: q } },
      { vendor: { contains: q } },
      { contractNo: { contains: q } },
      { description: { contains: q } },
    ];
  }

  const items = await prisma.maintenance.findMany({
    where,
    include: {
      facility: { select: { id: true, name: true } },
      part: {
        select: { id: true, partName: true, status: true, statusLabel: true },
      },
    },
    orderBy: [{ date: 'desc' }, { id: 'asc' }],
  });

  // BigInt → Number 직렬화
  const serialized = items.map((m) => ({
    ...m,
    amount: Number(m.amount),
  }));

  return NextResponse.json({ items: serialized });
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

  const parsed = maintenanceCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: '입력값이 올바르지 않습니다.', issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const d = parsed.data;
  const date = new Date(d.date);
  try {
    const created = await prisma.maintenance.create({
      data: {
        date,
        year: date.getFullYear(),
        facilityId: d.facilityId,
        equipmentId: d.equipmentId || null,
        partId: d.partId || null,
        category: d.category,
        subcategory: d.subcategory,
        name: d.name,
        vendor: d.vendor || null,
        amount: BigInt(d.amount),
        contractType: d.contractType,
        contractNo: d.contractNo || null,
        description: d.description || null,
      },
    });
    return NextResponse.json(
      { item: { ...created, amount: Number(created.amount) } },
      { status: 201 },
    );
  } catch (err) {
    console.error('[POST /api/maintenance]', err);
    return NextResponse.json(
      { error: '계약 생성 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
