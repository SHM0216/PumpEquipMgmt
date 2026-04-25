import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { YearlyTrendChart } from '@/components/dashboard/YearlyTrendChart';
import { Download } from 'lucide-react';
import {
  fmtBillion,
  fmtKRW,
  fmtMillion,
  fmtNumber,
} from '@/lib/format';
import { PART_STATUS, PART_STATUS_KEYS } from '@/lib/part-constants';

export const dynamic = 'force-dynamic';

const FACILITY_LABEL: Record<string, string> = {
  ws1: '월성1',
  ws2: '월성2',
  ws3: '월성3',
  'ws-daemyeong': '대명유수지',
  'ws-common': '월성공통',
};

export default async function ReportsPage() {
  const [yearGroups, facilityGroups, subGroups, partsAll] = await Promise.all([
    prisma.maintenance.groupBy({
      by: ['year'],
      _sum: { amount: true },
      _count: { _all: true },
      orderBy: { year: 'asc' },
    }),
    prisma.maintenance.groupBy({
      by: ['facilityId'],
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.maintenance.groupBy({
      by: ['subcategory'],
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.part.findMany({
      select: { facilityCode: true, status: true },
    }),
  ]);

  const facilityMap = await prisma.facility
    .findMany({ select: { id: true, name: true } })
    .then((arr) => new Map(arr.map((f) => [f.id, f.name])));

  // 연도별 추이
  const yearlyData = yearGroups.map((g) => ({
    year: g.year,
    amount: Number(g._sum.amount ?? 0),
    count: g._count._all,
  }));

  // 시설별 합계 + 비중
  const facilityRows = facilityGroups
    .map((g) => ({
      facilityId: g.facilityId,
      facilityName: facilityMap.get(g.facilityId) ?? g.facilityId,
      count: g._count._all,
      amount: Number(g._sum.amount ?? 0),
    }))
    .sort((a, b) => b.amount - a.amount);
  const grandTotal = facilityRows.reduce((s, r) => s + r.amount, 0);

  // 세부구분 TOP 10
  const subTop10 = subGroups
    .map((g) => ({
      subcategory: g.subcategory,
      count: g._count._all,
      amount: Number(g._sum.amount ?? 0),
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  // 부품 상태 매트릭스
  const partMatrix = new Map<string, Map<string, number>>();
  for (const p of partsAll) {
    if (!partMatrix.has(p.facilityCode))
      partMatrix.set(p.facilityCode, new Map());
    const inner = partMatrix.get(p.facilityCode)!;
    inner.set(p.status, (inner.get(p.status) ?? 0) + 1);
  }
  const facilityCodes = ['ws1', 'ws2', 'ws3', 'ws-daemyeong', 'ws-common'];

  return (
    <>
      <Topbar
        title="통계 보고서"
        subtitle="연도별 추이 / 시설·세부구분 집계 / 부품 상태 매트릭스 / CSV 내보내기"
      />
      <main className="flex-1 space-y-6 px-4 py-6 lg:px-8">
        {/* 1. 연도별 추이 */}
        <Section
          title="연도별 집행 추이"
          subtitle={`${yearlyData[0]?.year ?? '-'} ~ ${yearlyData[yearlyData.length - 1]?.year ?? '-'}`}
        >
          <YearlyTrendChart data={yearlyData} />
        </Section>

        {/* 2. 시설별 투입비 */}
        <Section title="시설별 투입비 구성">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>시설</TableHead>
                <TableHead className="text-right">건수</TableHead>
                <TableHead className="text-right">합계 (원)</TableHead>
                <TableHead className="text-right">백만원</TableHead>
                <TableHead className="text-right">비중</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facilityRows.map((r) => (
                <TableRow key={r.facilityId}>
                  <TableCell>{r.facilityName}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {fmtNumber(r.count)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {fmtNumber(r.amount)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {fmtMillion(r.amount)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-ink-muted">
                    {grandTotal > 0
                      ? `${((r.amount / grandTotal) * 100).toFixed(1)}%`
                      : '-'}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell className="font-semibold text-accent">합계</TableCell>
                <TableCell className="text-right font-semibold tabular-nums text-accent">
                  {fmtNumber(facilityRows.reduce((s, r) => s + r.count, 0))}
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums text-accent">
                  {fmtKRW(grandTotal)}
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums text-accent">
                  {fmtBillion(grandTotal)}억
                </TableCell>
                <TableCell className="text-right font-semibold text-accent">
                  100%
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Section>

        {/* 3. 세부구분 TOP 10 */}
        <Section title="세부구분별 TOP 10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>세부구분</TableHead>
                <TableHead className="text-right">건수</TableHead>
                <TableHead className="text-right">백만원</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subTop10.map((r, i) => (
                <TableRow key={r.subcategory}>
                  <TableCell className="text-xs text-ink-muted">{i + 1}</TableCell>
                  <TableCell>{r.subcategory}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {fmtNumber(r.count)}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {fmtMillion(r.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>

        {/* 4. 부품 상태 매트릭스 */}
        <Section title="부품 상태 요약 매트릭스">
          <div className="overflow-x-auto rounded border border-line">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-ink-muted">
                    시설
                  </th>
                  {PART_STATUS_KEYS.map((s) => (
                    <th
                      key={s}
                      className="px-3 py-2 text-right text-xs font-semibold text-ink-muted"
                    >
                      {PART_STATUS[s].label}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-right text-xs font-semibold text-accent">
                    합계
                  </th>
                </tr>
              </thead>
              <tbody>
                {facilityCodes.map((code) => {
                  const inner = partMatrix.get(code) ?? new Map();
                  const rowTotal = PART_STATUS_KEYS.reduce(
                    (s, k) => s + (inner.get(k) ?? 0),
                    0,
                  );
                  if (rowTotal === 0) return null;
                  return (
                    <tr key={code} className="border-t border-line">
                      <td className="px-3 py-2 text-xs">
                        {FACILITY_LABEL[code] ?? code}
                      </td>
                      {PART_STATUS_KEYS.map((s) => {
                        const v = inner.get(s) ?? 0;
                        return (
                          <td
                            key={s}
                            className={`px-3 py-2 text-right tabular-nums ${
                              v > 0 && s === 'overdue' ? 'font-semibold text-red-700' : ''
                            }`}
                          >
                            {v > 0 ? v : <span className="text-ink-muted/40">·</span>}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-right font-semibold tabular-nums text-accent">
                        {rowTotal}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>

        {/* 5. CSV 내보내기 */}
        <Section title="CSV 내보내기" subtitle="UTF-8 BOM 포함, Excel에서 한글 정상 표시">
          <div className="flex flex-wrap gap-2">
            <CsvButton kind="facilities" label="시설" />
            <CsvButton kind="equipment" label="설비" />
            <CsvButton kind="parts" label="부품 ★" />
            <CsvButton kind="maintenance" label="유지보수" />
          </div>
        </Section>
      </main>
    </>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-line bg-white p-5">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      {subtitle && (
        <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p>
      )}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function CsvButton({ kind, label }: { kind: string; label: string }) {
  return (
    <Button asChild variant="outline" size="sm">
      <a href={`/api/export/${kind}`} download>
        <Download className="mr-1 h-3.5 w-3.5" />
        {label} CSV
      </a>
    </Button>
  );
}
