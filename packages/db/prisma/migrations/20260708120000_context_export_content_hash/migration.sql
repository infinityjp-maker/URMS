-- Context export baseline for conflict detection (B-023 / export v1.4)
ALTER TABLE "context_snapshots" ADD COLUMN "export_content_hash" TEXT;
