-- CreateTable
CREATE TABLE "Facility" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'pump',
    "installYear" INTEGER,
    "installMonth" INTEGER,
    "location" TEXT,
    "power" TEXT,
    "pumpCount" INTEGER,
    "pumpCapacity" TEXT,
    "pumpSpec" TEXT,
    "screen" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "facilityId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "model" TEXT,
    "vendor" TEXT,
    "installDate" DATETIME,
    "lifeYears" INTEGER,
    "lastMaintDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'good',
    "remark" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Equipment_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Part" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "facilityCode" TEXT NOT NULL,
    "facilityLabel" TEXT NOT NULL,
    "equipmentGroup" TEXT NOT NULL,
    "equipmentId" TEXT,
    "partName" TEXT NOT NULL,
    "spec" TEXT,
    "history" TEXT,
    "cycle" TEXT,
    "cycleMonths" INTEGER,
    "nextTime" TEXT,
    "nextYear" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'normal',
    "statusLabel" TEXT,
    "overdue" BOOLEAN NOT NULL DEFAULT false,
    "isNew" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Part_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PartEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "eventType" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "note" TEXT,
    "maintenanceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PartEvent_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Maintenance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "year" INTEGER NOT NULL,
    "facilityId" TEXT NOT NULL,
    "equipmentId" TEXT,
    "partId" TEXT,
    "category" TEXT NOT NULL,
    "subcategory" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vendor" TEXT,
    "amount" BIGINT NOT NULL,
    "contractType" TEXT NOT NULL,
    "contractNo" TEXT,
    "serialNo" INTEGER,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Maintenance_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Maintenance_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Maintenance_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Inspection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "facilityId" TEXT NOT NULL,
    "equipmentId" TEXT,
    "partId" TEXT,
    "inspType" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "memo" TEXT,
    "inspector" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Inspection_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Inspection_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PmMaster" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "subcategory" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "cycleMonths" INTEGER NOT NULL,
    "basis" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "refType" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "docCategory" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "filepath" TEXT NOT NULL,
    "mimeType" TEXT,
    "size" INTEGER,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedBy" TEXT
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "department" TEXT,
    "email" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "targetId" TEXT,
    "changes" TEXT,
    "ip" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Facility_name_idx" ON "Facility"("name");

-- CreateIndex
CREATE INDEX "Equipment_facilityId_category_idx" ON "Equipment"("facilityId", "category");

-- CreateIndex
CREATE INDEX "Equipment_status_idx" ON "Equipment"("status");

-- CreateIndex
CREATE INDEX "Part_facilityCode_idx" ON "Part"("facilityCode");

-- CreateIndex
CREATE INDEX "Part_equipmentGroup_idx" ON "Part"("equipmentGroup");

-- CreateIndex
CREATE INDEX "Part_status_idx" ON "Part"("status");

-- CreateIndex
CREATE INDEX "Part_nextYear_idx" ON "Part"("nextYear");

-- CreateIndex
CREATE INDEX "Part_equipmentId_idx" ON "Part"("equipmentId");

-- CreateIndex
CREATE INDEX "PartEvent_year_idx" ON "PartEvent"("year");

-- CreateIndex
CREATE UNIQUE INDEX "PartEvent_partId_year_eventType_key" ON "PartEvent"("partId", "year", "eventType");

-- CreateIndex
CREATE INDEX "Maintenance_year_idx" ON "Maintenance"("year");

-- CreateIndex
CREATE INDEX "Maintenance_facilityId_year_idx" ON "Maintenance"("facilityId", "year");

-- CreateIndex
CREATE INDEX "Maintenance_category_subcategory_idx" ON "Maintenance"("category", "subcategory");

-- CreateIndex
CREATE INDEX "Maintenance_partId_idx" ON "Maintenance"("partId");

-- CreateIndex
CREATE INDEX "Inspection_facilityId_date_idx" ON "Inspection"("facilityId", "date");

-- CreateIndex
CREATE INDEX "Inspection_result_idx" ON "Inspection"("result");

-- CreateIndex
CREATE UNIQUE INDEX "PmMaster_category_subcategory_item_key" ON "PmMaster"("category", "subcategory", "item");

-- CreateIndex
CREATE INDEX "Attachment_refType_refId_idx" ON "Attachment"("refType", "refId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");
