import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { fmtDate } from '@/lib/format';

type Ctx = { params: Promise<{ kind: string }> };

const KINDS = ['facilities', 'equipment', 'parts', 'maintenance'] as const;
type Kind = (typeof KINDS)[number];

function isValidKind(k: string): k is Kind {
  return (KINDS as readonly string[]).includes(k);
}

function csvCell(v: unknown): string {
  if (v == null) return '';
  const s = String(v).replace(/"/gu, '""');
  if (/[",\n]/u.test(s)) return `"${s}"`;
  return s;
}

function buildCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(csvCell).join(',')];
  for (const r of rows) lines.push(r.map(csvCell).join(','));
  // Excel 한글을 위한 UTF-8 BOM
  return '﻿' + lines.join('\n');
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { kind } = await ctx.params;
  if (!isValidKind(kind)) {
    return NextResponse.json(
      { error: `지원하지 않는 export 종류: ${kind}` },
      { status: 400 },
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  let csv: string;
  switch (kind) {
    case 'facilities':
      csv = await exportFacilities();
      break;
    case 'equipment':
      csv = await exportEquipment();
      break;
    case 'parts':
      csv = await exportParts();
      break;
    case 'maintenance':
      csv = await exportMaintenance();
      break;
  }

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="rpms_${kind}_${today}.csv"`,
    },
  });
}

async function exportFacilities() {
  const items = await prisma.facility.findMany({ orderBy: { id: 'asc' } });
  return buildCsv(
    ['시설ID', '시설명', '종류', '설치년', '설치월', '위치', '전기용량', '펌프수', '용량', '규격', '제진기', '비고'],
    items.map((f) => [
      f.id,
      f.name,
      f.kind,
      f.installYear ?? '',
      f.installMonth ?? '',
      f.location ?? '',
      f.power ?? '',
      f.pumpCount ?? '',
      f.pumpCapacity ?? '',
      f.pumpSpec ?? '',
      f.screen ?? '',
      f.note ?? '',
    ]),
  );
}

async function exportEquipment() {
  const items = await prisma.equipment.findMany({
    include: { facility: { select: { name: true } } },
    orderBy: [{ facilityId: 'asc' }, { category: 'asc' }, { name: 'asc' }],
  });
  return buildCsv(
    ['시설', '대분류', '세부구분', '설비명', '모델', '제조사', '설치일', '내용연수', '최근정비', '상태', '비고'],
    items.map((e) => [
      e.facility.name,
      e.category,
      e.subcategory,
      e.name,
      e.model ?? '',
      e.vendor ?? '',
      e.installDate ? fmtDate(e.installDate) : '',
      e.lifeYears ?? '',
      e.lastMaintDate ? fmtDate(e.lastMaintDate) : '',
      e.status,
      e.remark ?? '',
    ]),
  );
}

async function exportParts() {
  const items = await prisma.part.findMany({
    orderBy: [
      { facilityLabel: 'asc' },
      { equipmentGroup: 'asc' },
      { partName: 'asc' },
    ],
  });
  return buildCsv(
    ['시설', '대분류', '부품/작업', '규격·수량', '시행주기', '차기시기', '차기연도', '상태코드', '상태', '시행이력', '비고'],
    items.map((p) => [
      p.facilityLabel,
      p.equipmentGroup,
      p.partName,
      p.spec ?? '',
      p.cycle ?? '',
      p.nextTime ?? '',
      p.nextYear ?? '',
      p.status,
      p.statusLabel ?? '',
      p.history ?? '',
      p.note ?? '',
    ]),
  );
}

async function exportMaintenance() {
  const items = await prisma.maintenance.findMany({
    include: {
      facility: { select: { name: true } },
      part: { select: { partName: true } },
    },
    orderBy: [{ date: 'asc' }],
  });
  return buildCsv(
    [
      '계약일',
      '연도',
      '시설',
      '대분류',
      '세부구분',
      '계약명',
      '업체',
      '계약종류',
      '계약번호',
      '금액(원)',
      '연결부품',
      '설명',
    ],
    items.map((m) => [
      fmtDate(m.date),
      m.year,
      m.facility.name,
      m.category,
      m.subcategory,
      m.name,
      m.vendor ?? '',
      m.contractType,
      m.contractNo ?? '',
      Number(m.amount),
      m.part?.partName ?? '',
      m.description ?? '',
    ]),
  );
}
