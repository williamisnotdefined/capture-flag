ALTER TABLE "organizations" ADD COLUMN "deleted_at" TIMESTAMP(3);

ALTER TABLE "projects" ADD COLUMN "deleted_at" TIMESTAMP(3);

CREATE INDEX "organizations_deleted_at_idx" ON "organizations"("deleted_at");

DROP INDEX IF EXISTS "projects_organization_id_idx";

CREATE INDEX "projects_organization_id_deleted_at_idx" ON "projects"("organization_id", "deleted_at");
