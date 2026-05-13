DROP INDEX "feature_flags_config_id_key_key";

CREATE UNIQUE INDEX "feature_flags_config_id_key_active_key"
ON "feature_flags"("config_id", "key")
WHERE "deleted_at" IS NULL;
