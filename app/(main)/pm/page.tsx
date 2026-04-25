import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PartStatusBadge } from '@/components/domain/parts/PartStatusBadge';
import {
  computeEquipmentAlerts,
  computePartAlerts,
  type AlertLevel,
} from '@/lib/pm-engine';
import { fmtDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

const LEVEL_VARIANT: Record<
  AlertLevel,
  'danger' | 'warning' | 'success' | 'info'
> = {
  critical: 'danger',
  warning: 'warning',
  normal: 'success',
  info: 'info',
};

const LEVEL_KO: Record<AlertLevel, string> = {
  critical: '긴급',
  warning: '주의',
  normal: '예정',
  info: '정보',
};

export default async function PmPage() {
  const [equipment, pmMaster, parts] = await Promise.all([
    prisma.equipment.findMany({
      include: { facility: { select: { name: true } } },
    }),
    prisma.pmMaster.findMany({ where: { active: true } }),
    prisma.part.findMany(),
  ]);

  const equipmentAlerts = computeEquipmentAlerts(equipment, pmMaster);
  const partAlerts = computePartAlerts(parts);

  return (
    <>
      <Topbar
        title="예방정비"
        subtitle="Equipment 주기 매칭 + Part 차기연도 기반 도래 알림"
      />
      <main className="flex-1 space-y-8 px-4 py-6 lg:px-8">
        {/* Equipment 기반 */}
        <section>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-base font-semibold text-ink">
              📅 Equipment 기반 임박 예방정비
            </h2>
            <p className="text-xs text-ink-muted">
              {equipmentAlerts.length}건 (D-180 이내)
            </p>
          </div>
          <div className="rounded-lg border border-line bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">레벨</TableHead>
                  <TableHead>설비</TableHead>
                  <TableHead className="w-[180px]">정비항목</TableHead>
                  <TableHead className="w-[110px]">최근수행</TableHead>
                  <TableHead className="w-[110px]">차기예정</TableHead>
                  <TableHead className="w-[110px]">잔여</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipmentAlerts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-sm text-ink-muted"
                    >
                      D-180 이내 임박 일정이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  equipmentAlerts.map((a) => (
                    <TableRow key={a.equipmentId}>
                      <TableCell>
                        <Badge variant={LEVEL_VARIANT[a.level]}>
                          {LEVEL_KO[a.level]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{a.equipmentName}</div>
                        <div className="text-xs text-ink-muted">
                          {a.facilityName} · {a.category} / {a.subcategory}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-ink-muted">
                        {a.pmItem ?? '-'} ({a.cycleMonths}개월)
                      </TableCell>
                      <TableCell className="text-xs tabular-nums">
                        {fmtDate(a.lastMaintDate)}
                      </TableCell>
                      <TableCell className="text-xs tabular-nums">
                        {fmtDate(a.dueDate)}
                      </TableCell>
                      <TableCell
                        className={`text-xs font-semibold tabular-nums ${
                          a.level === 'critical'
                            ? 'text-red-700'
                            : a.level === 'warning'
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                        }`}
                      >
                        {a.levelLabel}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Part 기반 */}
        <section>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-base font-semibold text-ink">
              ★ Part 기반 도래·누적지연 ({partAlerts.length}건)
            </h2>
            <p className="text-xs text-ink-muted">
              누적지연 + 당년도/익년 도래 + 신설 부품
            </p>
          </div>
          <div className="rounded-lg border border-line bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">레벨</TableHead>
                  <TableHead className="w-[90px]">시설</TableHead>
                  <TableHead className="w-[80px]">대분류</TableHead>
                  <TableHead>부품/작업</TableHead>
                  <TableHead className="w-[100px]">주기</TableHead>
                  <TableHead className="w-[120px]">차기시기</TableHead>
                  <TableHead className="w-[110px]">상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partAlerts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center text-sm text-ink-muted"
                    >
                      도래·누적지연 부품이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  partAlerts.map((a) => (
                    <TableRow key={a.partId}>
                      <TableCell>
                        <Badge variant={LEVEL_VARIANT[a.level]}>
                          {a.levelLabel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-ink-muted">
                        {a.facilityLabel}
                      </TableCell>
                      <TableCell className="text-xs">
                        {a.equipmentGroup}
                      </TableCell>
                      <TableCell className="font-medium">
                        {a.partName}
                      </TableCell>
                      <TableCell className="text-xs">
                        {a.cycle ?? '-'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {a.nextTime ??
                          (a.nextYear ? `${a.nextYear}년` : '-')}
                      </TableCell>
                      <TableCell>
                        <PartStatusBadge
                          status={a.status}
                          statusLabel={a.statusLabel}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        {/* PmMaster */}
        <section>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-base font-semibold text-ink">
              주기 마스터 ({pmMaster.length}건)
            </h2>
            <p className="text-xs text-ink-muted">
              category × subcategory 매칭으로 차기 예정일 자동 계산
            </p>
          </div>
          <div className="rounded-lg border border-line bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">대분류</TableHead>
                  <TableHead className="w-[160px]">세부구분</TableHead>
                  <TableHead>점검·교체 항목</TableHead>
                  <TableHead className="w-[100px] text-right">주기(개월)</TableHead>
                  <TableHead className="w-[200px]">근거</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pmMaster.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs">{p.category}</TableCell>
                    <TableCell className="text-xs">{p.subcategory}</TableCell>
                    <TableCell>{p.item}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {p.cycleMonths}
                    </TableCell>
                    <TableCell className="text-xs text-ink-muted">
                      {p.basis ?? '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      </main>
    </>
  );
}
