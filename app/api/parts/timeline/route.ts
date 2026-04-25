import { NextResponse, type NextRequest } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const facilityCode = searchParams.get('facilityCode');
  const equipmentGroup = searchParams.get('equipmentGroup');

  const where: Prisma.PartWhereInput = {};
  if (facilityCode && facilityCode !== 'all') where.facilityCode = facilityCode;
  if (equipmentGroup && equipmentGroup !== 'all')
    where.equipmentGroup = equipmentGroup;

  const parts = await prisma.part.findMany({
    where,
    include: { events: true },
    orderBy: [
      { facilityLabel: 'asc' },
      { equipmentGroup: 'asc' },
      { partName: 'asc' },
    ],
  });

  const rows = parts.map((p) => ({
    id: p.id,
    facilityLabel: p.facilityLabel,
    facilityCode: p.facilityCode,
    equipmentGroup: p.equipmentGroup,
    partName: p.partName,
    status: p.status,
    eventsByYear: Object.fromEntries(p.events.map((e) => [String(e.year), e.symbol])),
  }));
  return NextResponse.json({ rows });
}
