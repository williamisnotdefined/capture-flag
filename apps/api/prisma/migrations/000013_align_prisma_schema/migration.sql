ALTER TABLE "api_tokens" ALTER COLUMN "updated_at" DROP DEFAULT;

ALTER TABLE "api_tokens" RENAME CONSTRAINT "api_tokens_project_organization_fkey" TO "api_tokens_project_id_organization_id_fkey";
ALTER TABLE "audit_logs" RENAME CONSTRAINT "audit_logs_config_project_fkey" TO "audit_logs_config_id_project_id_fkey";
ALTER TABLE "audit_logs" RENAME CONSTRAINT "audit_logs_project_organization_fkey" TO "audit_logs_project_id_organization_id_fkey";
ALTER TABLE "config_environment_states" RENAME CONSTRAINT "config_environment_states_config_project_fkey" TO "config_environment_states_config_id_project_id_fkey";
ALTER TABLE "config_environment_states" RENAME CONSTRAINT "config_environment_states_environment_project_fkey" TO "config_environment_states_environment_id_project_id_fkey";
ALTER TABLE "feature_flag_environment_values" RENAME CONSTRAINT "feature_flag_environment_values_config_project_fkey" TO "feature_flag_environment_values_config_id_project_id_fkey";
ALTER TABLE "feature_flag_environment_values" RENAME CONSTRAINT "feature_flag_environment_values_environment_project_fkey" TO "feature_flag_environment_values_environment_id_project_id_fkey";
ALTER TABLE "feature_flag_environment_values" RENAME CONSTRAINT "feature_flag_environment_values_feature_flag_project_config_fke" TO "feature_flag_environment_values_feature_flag_id_project_id_fkey";
ALTER TABLE "feature_flags" RENAME CONSTRAINT "feature_flags_config_project_fkey" TO "feature_flags_config_id_project_id_fkey";
ALTER TABLE "sdk_keys" RENAME CONSTRAINT "sdk_keys_config_project_fkey" TO "sdk_keys_config_id_project_id_fkey";
ALTER TABLE "sdk_keys" RENAME CONSTRAINT "sdk_keys_environment_project_fkey" TO "sdk_keys_environment_id_project_id_fkey";
ALTER TABLE "segments" RENAME CONSTRAINT "segments_config_project_fkey" TO "segments_config_id_project_id_fkey";

ALTER INDEX "feature_flag_environment_values_feature_flag_id_environment_id_" RENAME TO "feature_flag_environment_values_feature_flag_id_environment_key";
