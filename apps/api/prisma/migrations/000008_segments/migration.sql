CREATE TABLE "segments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "project_id" UUID NOT NULL,
  "config_id" UUID NOT NULL,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "conditions_json" JSONB NOT NULL DEFAULT '[]'::JSONB,
  "deleted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "segments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "segments_key_check" CHECK ("key" ~ '^[A-Za-z][A-Za-z0-9_.-]*$'),
  CONSTRAINT "segments_name_check" CHECK (length(trim("name")) > 0),
  CONSTRAINT "segments_conditions_json_check" CHECK (jsonb_typeof("conditions_json") = 'array')
);

CREATE UNIQUE INDEX "segments_config_id_key_active_key" ON "segments"("config_id", "key") WHERE "deleted_at" IS NULL;
CREATE UNIQUE INDEX "segments_id_project_id_config_id_key" ON "segments"("id", "project_id", "config_id");
CREATE INDEX "segments_project_id_config_id_idx" ON "segments"("project_id", "config_id");

ALTER TABLE "segments" ADD CONSTRAINT "segments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "segments" ADD CONSTRAINT "segments_config_project_fkey" FOREIGN KEY ("config_id", "project_id") REFERENCES "configs"("id", "project_id") ON DELETE CASCADE ON UPDATE CASCADE;
