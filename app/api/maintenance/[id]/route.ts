import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { maintenanceUpdateSchema } from '@/lib/validators/maintenance';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const m = await prisma.maintenance.findUnique({
    where: { id },
    include: {
      facility: { select: { id: true, name: true } },
      part: {
        select: { id: true, partName: true, status: true, statusLabel: true },
      },
    },
  });
  if (!m) {
    return NextResponse.json(
      { error: '계약을 찾을 수 없습니다.' },
      { status: 404 },
    );
  }
  return NextResponse.json({ item: { ...m, amount: Number(m.amount) } });
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
  const parsed = maintenanceUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: '입력값이 올바르지 않습니다.', issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const d = parsed.data;
  try {
    const updated = await prisma.maintenance.update({
      where: { id },
      data: {
        ...(d.date && { date: new Date(d.date), year: new Date(d.date).getFullYear() }),
        ...(d.facilityId && { facilityId: d.facilityId }),
        ...(d.equipmentId !== undefined && {
          equipmentId: d.equipmentId || null,
        }),
        ...(d.partId !== undefined && { partId: d.partId || null }),
        ...(d.category && { category: d.category }),
        ...(d.subcategory !== undefined && { subcategory: d.subcategory }),
        ...(d.name !== undefined && { name: d.name }),
        ...(d.vendor !== undefined && { vendor: d.vendor || null }),
        ...(d.amount !== undefined && { amount: BigInt(d.amount) }),
        ...(d.contractType && { contractType: d.contractType }),
        ...(d.contractNo !== undefined && { contractNo: d.contractNo || null }),
        ...(d.description !== undefined && {
          description: d.description || null,
        }),
      },
    });
    return NextResponse.json({
      item: { ...updated, amount: Number(updated.amount) },
    });
  } catch (err) {
    console.error('[PATCH /api/maintenance/[id]]', err);
    return NextResponse.json(
      { error: '계약 수정 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    await prisma.maintenance.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/maintenance/[id]]', err);
    return NextResponse.json(
      { error: '계약 삭제 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
