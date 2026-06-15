-- Add labels column to Task table
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "labels" TEXT[] NOT NULL DEFAULT '{}';
