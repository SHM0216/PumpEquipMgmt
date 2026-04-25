import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { equipmentUpdateSchema } from '@/lib/validators/equipment';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const equipment = await prisma.equipment.findUnique({
    where: { id },
    include: {
      facility: true,
      parts: { orderBy: { partName: 'asc' } },
      maintenance: { orderBy: { date: 'desc' } },
    },
  });
  if (!equipment) {
    return NextResponse.json(
      { error: '설비를 찾을 수 없습니다.' },
      { status: 404 },
    );
  }
  return NextResponse.json({ equipment });
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
  const parsed = equipmentUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: '입력값이 올바르지 않습니다.', issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const d = parsed.data;
  try {
    const updated = await prisma.equipment.update({
      where: { id },
      data: {
        ...(d.facilityId && { facilityId: d.facilityId }),
        ...(d.category && { category: d.category }),
        ...(d.subcategory !== undefined && { subcategory: d.subcategory }),
        ...(d.name !== undefined && { name: d.name }),
        ...(d.model !== undefined && { model: d.model || null }),
        ...(d.vendor !== undefined && { vendor: d.vendor || null }),
        ...(d.installDate !== undefined && {
          installDate: d.installDate ? new Date(d.installDate) : null,
        }),
        ...(d.lifeYears !== undefined && {
          lifeYears:
            d.lifeYears === '' || d.lifeYears === undefined
              ? null
              : Number(d.lifeYears),
        }),
        ...(d.lastMaintDate !== undefined && {
          lastMaintDate: d.lastMaintDate ? new Date(d.lastMaintDate) : null,
        }),
        ...(d.status && { status: d.status }),
        ...(d.remark !== undefined && { remark: d.remark || null }),
      },
    });
    return NextResponse.json({ equipment: updated });
  } catch (err) {
    console.error('[PATCH /api/equipment/[id]]', err);
    return NextResponse.json(
      { error: '설비 수정 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    await prisma.equipment.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/equipment/[id]]', err);
    return NextResponse.json(
      { error: '설비 삭제 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
