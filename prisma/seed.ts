/**
 * Prisma Seed Script
 * - seed/*.json 파일을 읽어 DB에 초기 데이터를 투입합니다.
 * - 실행: npx prisma db seed
 *
 * 시드 순서:
 *   1) Facility       (시설물 3개: 월성1·2·3)
 *   2) PmMaster       (예방정비 주기 마스터 15건)
 *   3) Equipment      (호기 단위 설비 25건)
 *   4) Maintenance    (계약 이력 51건)
 *   5) Part           (부품·작업 단위 48건)  ★ 핵심
 *   6) PartEvent      (부품 연도별 이벤트 — 타임라인용)
 */
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function loadJson<T>(filename: string): T {
  const filepath = path.join(process.cwd(), 'seed', filename);
  const raw = fs.readFileSync(filepath, 'utf-8');
  return JSON.parse(raw) as T;
}

interface PartSeed {
  id?: string;
  facilityCode: string;
  facilityLabel: string;
  equipmentGroup: string;
  partName: string;
  spec?: string;
  history?: string;
  cycle?: string;
  nextTime?: string;
  nextYear?: number | null;
  status: string;
  statusLabel?: string;
  overdue?: boolean;
  isNew?: boolean;
}

interface TimelineSeed {
  id?: string;
  facilityCode: string;
  facilityLabel: string;
  equipmentGroup: string;
  partName: string;
  events: Record<string, string>;
}

// 타임라인 심볼 → eventType 매핑
const SYMBOL_TO_TYPE: Record<string, string> = {
  '●': 'done',
  '✓': 'done',
  '◐': 'planned',
  '★': 'overdue',
  '◆': 'new',
};

async function main() {
  console.log('🌱 시드 데이터 투입 시작...\n');

  // 1. Facilities
  const facilities = loadJson<any[]>('facilities.json');
  for (const f of facilities) {
    await prisma.facility.upsert({ where: { id: f.id }, update: f, create: f });
  }
  console.log(`   ✅ Facility: ${facilities.length}건`);

  // 2. PM Master
  const pmMaster = loadJson<any[]>('pm_master.json');
  for (const p of pmMaster) {
    await prisma.pmMaster.upsert({
      where: {
        category_subcategory_item: {
          category: p.category,
          subcategory: p.subcategory,
          item: p.item,
        },
      },
      update: p,
      create: p,
    });
  }
  console.log(`   ✅ PmMaster: ${pmMaster.length}건`);

  // 3. Equipment
  const equipment = loadJson<any[]>('equipment.json');
  await prisma.equipment.deleteMany({});
  for (const e of equipment) {
    await prisma.equipment.create({
      data: {
        ...e,
        installDate: e.installDate ? new Date(e.installDate) : null,
        lastMaintDate: e.lastMaintDate ? new Date(e.lastMaintDate) : null,
      },
    });
  }
  console.log(`   ✅ Equipment: ${equipment.length}건`);

  // 4. Maintenance
  const maintenance = loadJson<any[]>('maintenance.json');
  await prisma.maintenance.deleteMany({});
  for (const m of maintenance) {
    await prisma.maintenance.create({
      data: {
        ...m,
        date: new Date(m.date),
        year: new Date(m.date).getFullYear(),
        amount: BigInt(m.amount || 0),
      },
    });
  }
  console.log(`   ✅ Maintenance: ${maintenance.length}건`);

  // 5. Parts
  const parts = loadJson<PartSeed[]>('parts.json');
  await prisma.partEvent.deleteMany({});
  await prisma.part.deleteMany({});
  const partKeyToId = new Map<string, string>();

  for (const p of parts) {
    const created = await prisma.part.create({
      data: {
        facilityCode: p.facilityCode,
        facilityLabel: p.facilityLabel,
        equipmentGroup: p.equipmentGroup,
        partName: p.partName,
        spec: p.spec || null,
        history: p.history || null,
        cycle: p.cycle || null,
        nextTime: p.nextTime || null,
        nextYear: p.nextYear || null,
        status: p.status,
        statusLabel: p.statusLabel || null,
        overdue: !!p.overdue,
        isNew: !!p.isNew,
      },
    });
    const key = `${p.facilityLabel}|${p.equipmentGroup}|${p.partName}`;
    partKeyToId.set(key, created.id);
  }
  console.log(`   ✅ Part: ${parts.length}건`);

  // 6. PartEvent (타임라인)
  const timeline = loadJson<TimelineSeed[]>('parts_timeline.json');
  let eventCount = 0;
  for (const t of timeline) {
    // ★, ◆ 마커 제거 후 매칭
    const cleanName = t.partName.replace(/[★◆]\s*/g, '').trim();
    const key = `${t.facilityLabel}|${t.equipmentGroup}|${cleanName}`;
    const partId = partKeyToId.get(key);
    if (!partId) continue;

    for (const [yearStr, symbol] of Object.entries(t.events)) {
      const year = parseInt(yearStr, 10);
      const eventType = SYMBOL_TO_TYPE[symbol] || 'done';
      try {
        await prisma.partEvent.create({
          data: { partId, year, eventType, symbol },
        });
        eventCount++;
      } catch (e) {
        // unique violation 무시
      }
    }
  }
  console.log(`   ✅ PartEvent: ${eventCount}건`);

  const total =
    facilities.length + pmMaster.length + equipment.length +
    maintenance.length + parts.length + eventCount;
  console.log(`\n🎉 총 ${total}건 시드 완료.\n`);
}

main()
  .catch((e) => {
    console.error('❌ 시드 실패:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
