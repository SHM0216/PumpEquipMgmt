import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const facilities = await prisma.facility.findMany({
    orderBy: [{ kind: 'asc' }, { id: 'asc' }],
    include: {
      _count: { select: { equipment: true, maintenance: true } },
    },
  });
  return NextResponse.json({ facilities });
}
