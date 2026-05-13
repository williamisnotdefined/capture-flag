CREATE TABLE "feature_flags" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "project_id" UUID NOT NULL,
  "config_id" UUID NOT NULL,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "type" TEXT NOT NULL,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "hint" TEXT,
  "owner_user_id" UUID,
  "deleted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "feature_flags_type_check" CHECK ("type" IN ('boolean', 'string', 'integer', 'double'))
);

CREATE TABLE "feature_flag_environment_values" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "project_id" UUID NOT NULL,
  "config_id" UUID NOT NULL,
  "feature_flag_id" UUID NOT NULL,
  "environment_id" UUID NOT NULL,
  "default_value" JSONB NOT NULL,
  "rules_json" JSONB NOT NULL DEFAULT '[]'::JSONB,
  "percentage_attribute" TEXT NOT NULL DEFAULT 'identifier',
  "percentage_options_json" JSONB NOT NULL DEFAULT '[]'::JSONB,
  "updated_by_user_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "feature_flag_environment_values_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "feature_flag_environment_values_rules_json_check" CHECK (jsonb_typeof("rules_json") = 'array'),
  CONSTRAINT "feature_flag_environment_values_percentage_attribute_check" CHECK (length(trim("percentage_attribute")) > 0),
  CONSTRAINT "feature_flag_environment_values_percentage_options_json_check" CHECK (jsonb_typeof("percentage_options_json") = 'array')
);

CREATE UNIQUE INDEX "feature_flags_config_id_key_key" ON "feature_flags"("config_id", "key");
CREATE UNIQUE INDEX "feature_flags_id_project_id_config_id_key" ON "feature_flags"("id", "project_id", "config_id");
CREATE INDEX "feature_flags_project_id_config_id_idx" ON "feature_flags"("project_id", "config_id");
CREATE INDEX "feature_flags_owner_user_id_idx" ON "feature_flags"("owner_user_id");
CREATE UNIQUE INDEX "feature_flag_environment_values_feature_flag_id_environment_id_key" ON "feature_flag_environment_values"("feature_flag_id", "environment_id");
CREATE INDEX "feature_flag_environment_values_config_id_environment_id_idx" ON "feature_flag_environment_values"("config_id", "environment_id");
CREATE INDEX "feature_flag_environment_values_project_id_environment_id_idx" ON "feature_flag_environment_values"("project_id", "environment_id");
CREATE INDEX "feature_flag_environment_values_updated_by_user_id_idx" ON "feature_flag_environment_values"("updated_by_user_id");

ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_config_project_fkey" FOREIGN KEY ("config_id", "project_id") REFERENCES "configs"("id", "project_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "feature_flag_environment_values" ADD CONSTRAINT "feature_flag_environment_values_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "feature_flag_environment_values" ADD CONSTRAINT "feature_flag_environment_values_config_project_fkey" FOREIGN KEY ("config_id", "project_id") REFERENCES "configs"("id", "project_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "feature_flag_environment_values" ADD CONSTRAINT "feature_flag_environment_values_feature_flag_project_config_fkey" FOREIGN KEY ("feature_flag_id", "project_id", "config_id") REFERENCES "feature_flags"("id", "project_id", "config_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "feature_flag_environment_values" ADD CONSTRAINT "feature_flag_environment_values_environment_project_fkey" FOREIGN KEY ("environment_id", "project_id") REFERENCES "environments"("id", "project_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "feature_flag_environment_values" ADD CONSTRAINT "feature_flag_environment_values_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
