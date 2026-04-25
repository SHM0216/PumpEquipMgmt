import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    await prisma.inspection.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/inspections/[id]]', err);
    return NextResponse.json(
      { error: '점검 삭제 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
