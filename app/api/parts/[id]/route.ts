import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { partUpdateSchema } from '@/lib/validators/part';
import { serialize } from '@/lib/format';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const part = await prisma.part.findUnique({
    where: { id },
    include: {
      events: { orderBy: { year: 'asc' } },
      maintenance: { orderBy: { date: 'desc' } },
      equipment: { select: { id: true, name: true, facility: { select: { name: true } } } },
    },
  });
  if (!part) {
    return NextResponse.json(
      { error: '부품을 찾을 수 없습니다.' },
      { status: 404 },
    );
  }
  return NextResponse.json({ part: serialize(part) });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'JSON 본문을 파싱할 수 없습니다.' },
      { status: 400 },
    );
  }
  const parsed = partUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: '입력값이 올바르지 않습니다.', issues: parsed.error.issues },
      { status: 400 },
    );
  }
  try {
    const updated = await prisma.part.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ part: updated });
  } catch (err) {
    console.error('[PATCH /api/parts/[id]]', err);
    return NextResponse.json(
      { error: '부품 수정 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    await prisma.part.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/parts/[id]]', err);
    return NextResponse.json(
      { error: '부품 삭제 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
