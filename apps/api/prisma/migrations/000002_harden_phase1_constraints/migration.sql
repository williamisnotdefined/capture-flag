ALTER TABLE "organization_members"
  ADD CONSTRAINT "organization_members_role_check"
  CHECK ("role" IN ('owner', 'admin', 'member', 'viewer'));

ALTER TABLE "project_members"
  ADD CONSTRAINT "project_members_role_check"
  CHECK ("role" IN ('project_admin', 'developer', 'viewer'));

ALTER TABLE "config_environment_states"
  ALTER COLUMN "revision" SET DEFAULT 1;

ALTER TABLE "config_environment_states"
  ADD CONSTRAINT "config_environment_states_revision_check"
  CHECK ("revision" >= 1);

ALTER TABLE "config_environment_states"
  DROP CONSTRAINT "config_environment_states_config_id_fkey";

ALTER TABLE "config_environment_states"
  DROP CONSTRAINT "config_environment_states_environment_id_fkey";

ALTER TABLE "config_environment_states"
  ADD CONSTRAINT "config_environment_states_config_project_fkey"
  FOREIGN KEY ("config_id", "project_id")
  REFERENCES "configs"("id", "project_id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "config_environment_states"
  ADD CONSTRAINT "config_environment_states_environment_project_fkey"
  FOREIGN KEY ("environment_id", "project_id")
  REFERENCES "environments"("id", "project_id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "sdk_keys"
  DROP CONSTRAINT "sdk_keys_config_id_fkey";

ALTER TABLE "sdk_keys"
  DROP CONSTRAINT "sdk_keys_environment_id_fkey";

ALTER TABLE "sdk_keys"
  ADD CONSTRAINT "sdk_keys_config_project_fkey"
  FOREIGN KEY ("config_id", "project_id")
  REFERENCES "configs"("id", "project_id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "sdk_keys"
  ADD CONSTRAINT "sdk_keys_environment_project_fkey"
  FOREIGN KEY ("environment_id", "project_id")
  REFERENCES "environments"("id", "project_id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION enforce_project_member_organization_membership()
RETURNS trigger AS $$
DECLARE
  project_organization_id UUID;
BEGIN
  SELECT "organization_id"
  INTO project_organization_id
  FROM "projects"
  WHERE "id" = NEW."project_id";

  IF project_organization_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'foreign_key_violation', MESSAGE = 'Project not found for project member';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM "organization_members"
    WHERE "organization_id" = project_organization_id
      AND "user_id" = NEW."user_id"
  ) THEN
    RAISE EXCEPTION USING ERRCODE = 'foreign_key_violation', MESSAGE = 'Project member must belong to the project organization';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "project_members_organization_membership_guard"
BEFORE INSERT OR UPDATE OF "project_id", "user_id" ON "project_members"
FOR EACH ROW
EXECUTE FUNCTION enforce_project_member_organization_membership();

CREATE OR REPLACE FUNCTION cleanup_project_members_after_organization_member_delete()
RETURNS trigger AS $$
BEGIN
  DELETE FROM "project_members" "pm"
  USING "projects" "p"
  WHERE "pm"."project_id" = "p"."id"
    AND "p"."organization_id" = OLD."organization_id"
    AND "pm"."user_id" = OLD."user_id";

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "organization_members_project_members_cleanup"
AFTER DELETE ON "organization_members"
FOR EACH ROW
EXECUTE FUNCTION cleanup_project_members_after_organization_member_delete();
