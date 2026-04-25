import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import {
  InspectionList,
  type InspectionRow,
} from '@/components/domain/inspection/InspectionList';

export const dynamic = 'force-dynamic';

export default async function InspectionPage() {
  const [items, facilities] = await Promise.all([
    prisma.inspection.findMany({
      include: { facility: { select: { id: true, name: true } } },
      orderBy: [{ date: 'desc' }, { id: 'asc' }],
    }),
    prisma.facility.findMany({
      select: { id: true, name: true },
      orderBy: { id: 'asc' },
    }),
  ]);

  const rows: InspectionRow[] = items.map((r) => ({
    id: r.id,
    date: r.date.toISOString(),
    facility: r.facility,
    inspType: r.inspType,
    target: r.target,
    result: r.result,
    inspector: r.inspector,
    memo: r.memo,
  }));

  return (
    <>
      <Topbar
        title="점검일지"
        subtitle="현장 점검 기록 — 일일/주간/월간/정밀안전/수시"
      />
      <main className="flex-1 px-4 py-6 lg:px-8">
        <InspectionList rows={rows} facilities={facilities} />
      </main>
    </>
  );
}
