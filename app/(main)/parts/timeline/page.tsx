import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import {
  TimelineMatrix,
  type TimelineRow,
} from '@/components/domain/parts/TimelineMatrix';
import { TIMELINE_YEARS } from '@/lib/part-constants';

export const dynamic = 'force-dynamic';

export default async function PartsTimelinePage() {
  const parts = await prisma.part.findMany({
    include: { events: true },
    orderBy: [
      { facilityLabel: 'asc' },
      { equipmentGroup: 'asc' },
      { partName: 'asc' },
    ],
  });

  const rows: TimelineRow[] = parts.map((p) => ({
    id: p.id,
    facilityCode: p.facilityCode,
    facilityLabel: p.facilityLabel,
    equipmentGroup: p.equipmentGroup,
    partName: p.partName,
    status: p.status,
    statusLabel: p.statusLabel,
    eventsByYear: Object.fromEntries(
      p.events.map((e) => [String(e.year), e.symbol]),
    ),
  }));

  return (
    <>
      <Topbar
        title="부품 타임라인"
        subtitle="2020~2030 시행 매트릭스 (●완료 ◐예상 ★누적지연 ◆신설)"
      />
      <main className="flex-1 px-4 py-6 lg:px-8">
        <TimelineMatrix rows={rows} years={[...TIMELINE_YEARS]} />
      </main>
    </>
  );
}
