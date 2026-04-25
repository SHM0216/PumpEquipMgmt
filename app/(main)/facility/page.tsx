import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fmtBillion, fmtKRW, elapsedFromInstall } from '@/lib/format';

const PUMP_FACILITY_IDS = ['ws1', 'ws2', 'ws3'] as const;
const PUMP_FACILITY_LABELS: Record<string, string> = {
  ws1: '월성1',
  ws2: '월성2',
  ws3: '월성3',
};

const KIND_LABEL: Record<string, string> = {
  pump: '펌프장',
  reservoir: '유수지',
  common: '공통설비',
};

const KIND_VARIANT: Record<
  string,
  'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger' | 'info'
> = {
  pump: 'info',
  reservoir: 'success',
  common: 'secondary',
};

export default async function FacilityPage() {
  const facilities = await prisma.facility.findMany({
    orderBy: [{ kind: 'asc' }, { id: 'asc' }],
    include: {
      _count: { select: { equipment: true, maintenance: true } },
    },
  });

  const partsByFacility = await prisma.part.groupBy({
    by: ['facilityCode'],
    _count: { _all: true },
  });
  const partCountMap = new Map(
    partsByFacility.map((p) => [p.facilityCode, p._count._all]),
  );

  const maintTotalsByFacility = await prisma.maintenance.groupBy({
    by: ['facilityId'],
    _sum: { amount: true },
  });
  const maintTotalMap = new Map(
    maintTotalsByFacility.map((m) => [
      m.facilityId,
      m._sum.amount ? Number(m._sum.amount) : 0,
    ]),
  );

  const pumpFacilities = facilities.filter((f) =>
    PUMP_FACILITY_IDS.includes(f.id as (typeof PUMP_FACILITY_IDS)[number]),
  );

  const sumNum = (s: string | null | undefined) => {
    if (!s) return 0;
    const m = s.replace(/,/g, '').match(/-?\d+(\.\d+)?/u);
    return m ? Number(m[0]) : 0;
  };
  const totalPump = pumpFacilities.reduce(
    (sum, f) => sum + (f.pumpCount ?? 0),
    0,
  );
  const totalCapacity = pumpFacilities.reduce(
    (sum, f) => sum + sumNum(f.pumpCapacity),
    0,
  );

  return (
    <>
      <Topbar
        title="시설물 현황"
        subtitle="펌프장 3개소 + 대명유수지 + 월성공통"
      />
      <main className="flex-1 space-y-8 px-4 py-6 lg:px-8">
        {/* 종합 제원표 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-ink">
            펌프장 종합 제원표
          </h2>
          <div className="overflow-x-auto rounded-lg border border-line bg-white">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-ink-muted">
                <tr>
                  <th className="w-[160px] px-3 py-2 text-left font-semibold">
                    구분
                  </th>
                  {pumpFacilities.map((f) => (
                    <th
                      key={f.id}
                      className="px-3 py-2 text-left font-semibold"
                    >
                      {PUMP_FACILITY_LABELS[f.id]}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-left font-semibold text-accent">
                    합계
                  </th>
                </tr>
              </thead>
              <tbody className="[&_tr]:border-t [&_tr]:border-line">
                <SpecRow
                  label="설치년월"
                  values={pumpFacilities.map((f) =>
                    f.installYear
                      ? `${f.installYear}.${String(f.installMonth ?? 0).padStart(2, '0')}`
                      : '-',
                  )}
                />
                <SpecRow
                  label="전기용량"
                  values={pumpFacilities.map((f) => f.power ?? '-')}
                />
                <SpecRow
                  label="배수펌프 (대)"
                  values={pumpFacilities.map((f) => `${f.pumpCount ?? 0}대`)}
                  total={`${totalPump}대`}
                />
                <SpecRow
                  label="용량"
                  values={pumpFacilities.map((f) => f.pumpCapacity ?? '-')}
                  total={`${totalCapacity.toLocaleString('ko-KR')}㎥/min`}
                />
                <SpecRow
                  label="전동펌프"
                  values={pumpFacilities.map((f) => f.pumpSpec ?? '-')}
                />
                <SpecRow
                  label="제진기"
                  values={pumpFacilities.map((f) => f.screen ?? '-')}
                />
              </tbody>
            </table>
          </div>
        </section>

        {/* 시설 카드 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-ink">
            시설별 상세 ({facilities.length}개소)
          </h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {facilities.map((f) => {
              const partCount = partCountMap.get(f.id) ?? 0;
              const maintTotal = maintTotalMap.get(f.id) ?? 0;
              return (
                <Card key={f.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="leading-tight">{f.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {f.location ?? '-'}
                        </CardDescription>
                      </div>
                      <Badge variant={KIND_VARIANT[f.kind] ?? 'secondary'}>
                        {KIND_LABEL[f.kind] ?? f.kind}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-3 text-sm">
                    {f.kind === 'pump' && (
                      <PumpSpec facility={f} elapsed={
                        f.installYear
                          ? elapsedFromInstall(
                              new Date(f.installYear, (f.installMonth ?? 1) - 1, 1),
                            )
                          : '-'
                      } />
                    )}
                    {f.kind === 'reservoir' && (
                      <ReservoirSpec facility={f} />
                    )}
                    {f.kind === 'common' && <CommonSpec facility={f} />}
                    {f.note && (
                      <p className="rounded bg-muted px-2 py-1.5 text-xs text-ink-muted">
                        {f.note}
                      </p>
                    )}
                    <div className="grid grid-cols-3 gap-2 border-t border-line pt-3 text-xs">
                      <Stat label="설비" value={`${f._count.equipment}대`} />
                      <Stat label="부품" value={`${partCount}건`} highlight />
                      <Stat
                        label="누적비"
                        value={`${fmtBillion(maintTotal)}억`}
                        title={fmtKRW(maintTotal)}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* 공통 제원 정보 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-ink">
            공통 제원 정보
          </h2>
          <Card>
            <CardContent className="grid grid-cols-2 gap-x-6 gap-y-3 p-5 text-sm md:grid-cols-3 lg:grid-cols-4">
              <CommonInfo label="위치" value="대구광역시 달서구 달서대로 241-13" />
              <CommonInfo label="대지면적" value="40,300㎡" />
              <CommonInfo label="건축면적" value="4,503㎡" />
              <CommonInfo label="유역면적" value="53.29㎢" />
              <CommonInfo label="배수용량" value="14,150㎥/min" />
              <CommonInfo label="유수지 담수량" value="1,003천㎥" />
              <CommonInfo label="설계빈도" value="10년 (재현주기)" />
              <CommonInfo label="관할" value="달서구청 도시관리본부 배수운영과" />
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
}

function SpecRow({
  label,
  values,
  total,
}: {
  label: string;
  values: string[];
  total?: string;
}) {
  return (
    <tr>
      <th className="bg-muted/20 px-3 py-2 text-left text-xs font-medium text-ink-muted">
        {label}
      </th>
      {values.map((v, i) => (
        <td key={i} className="px-3 py-2 text-ink">
          {v}
        </td>
      ))}
      <td className="px-3 py-2 font-semibold text-accent">{total ?? '-'}</td>
    </tr>
  );
}

function Stat({
  label,
  value,
  highlight,
  title,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  title?: string;
}) {
  return (
    <div title={title}>
      <p className="text-[11px] text-ink-muted">{label}</p>
      <p
        className={`font-bold tabular-nums ${
          highlight ? 'text-accent' : 'text-ink'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function PumpSpec({
  facility,
  elapsed,
}: {
  facility: { installYear: number | null; installMonth: number | null; power: string | null; pumpCount: number | null; pumpCapacity: string | null; pumpSpec: string | null; screen: string | null };
  elapsed: string;
}) {
  return (
    <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
      <SpecLine
        label="설치"
        value={
          facility.installYear
            ? `${facility.installYear}.${String(facility.installMonth ?? 0).padStart(2, '0')} (${elapsed})`
            : '-'
        }
      />
      <SpecLine label="전기용량" value={facility.power} />
      <SpecLine label="펌프" value={`${facility.pumpCount ?? 0}대`} />
      <SpecLine label="용량" value={facility.pumpCapacity} />
      <SpecLine label="규격" value={facility.pumpSpec} />
      <SpecLine label="제진기" value={facility.screen} />
    </dl>
  );
}

function ReservoirSpec({
  facility,
}: {
  facility: { installYear: number | null; installMonth: number | null };
}) {
  return (
    <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
      <SpecLine
        label="설치"
        value={
          facility.installYear
            ? `${facility.installYear}.${String(facility.installMonth ?? 0).padStart(2, '0')}`
            : '-'
        }
      />
      <SpecLine label="용도" value="우수 일시 저류" />
    </dl>
  );
}

function CommonSpec({
  facility,
}: {
  facility: { note: string | null };
}) {
  return (
    <p className="text-xs text-ink-muted">
      {facility.note ?? '월성펌프장 전체 공통 설비 (수전·계전·UPS 등)'}
    </p>
  );
}

function SpecLine({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="flex gap-2">
      <dt className="w-14 shrink-0 text-ink-muted">{label}</dt>
      <dd className="flex-1 text-ink">{value ?? '-'}</dd>
    </div>
  );
}

function CommonInfo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-0.5 font-medium text-ink">{value}</p>
    </div>
  );
}
