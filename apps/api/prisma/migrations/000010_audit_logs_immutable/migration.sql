ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_config_project_fkey";
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_project_organization_fkey";
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_organization_id_fkey";

ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_project_organization_fkey" FOREIGN KEY ("project_id", "organization_id") REFERENCES "projects"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_config_project_fkey" FOREIGN KEY ("config_id", "project_id") REFERENCES "configs"("id", "project_id") ON DELETE RESTRICT ON UPDATE CASCADE;
