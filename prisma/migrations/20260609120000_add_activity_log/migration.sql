-- Migration: add_activity_log
-- Run: npx prisma migrate dev --name add_activity_log
--
-- If using Supabase's direct SQL editor instead, paste this block.

CREATE TABLE "ActivityLog" (
    "id"          TEXT NOT NULL,
    "projectId"   TEXT,
    "projectName" TEXT,
    "taskId"      TEXT,
    "taskTitle"   TEXT,
    "userId"      TEXT NOT NULL,
    "actorName"   TEXT,
    "action"      TEXT NOT NULL,
    "meta"        TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ActivityLog_projectId_idx" ON "ActivityLog"("projectId");
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");
