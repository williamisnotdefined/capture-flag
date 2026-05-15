CREATE TABLE "api_tokens" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" UUID NOT NULL,
  "project_id" UUID,
  "user_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "token_prefix" TEXT NOT NULL,
  "token_hash" TEXT NOT NULL,
  "scopes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "expires_at" TIMESTAMP(3),
  "revoked_at" TIMESTAMP(3),
  "last_used_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "api_tokens_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "api_tokens_scopes_check" CHECK (
    "scopes" <@ ARRAY[
      'projects:read',
      'projects:write',
      'configs:read',
      'configs:write',
      'members:read',
      'members:write',
      'flags:read',
      'flags:write',
      'environments:read',
      'segments:read',
      'segments:write'
    ]::TEXT[]
  )
);

CREATE UNIQUE INDEX "api_tokens_token_prefix_key" ON "api_tokens"("token_prefix");
CREATE UNIQUE INDEX "api_tokens_token_hash_key" ON "api_tokens"("token_hash");
CREATE INDEX "api_tokens_organization_id_idx" ON "api_tokens"("organization_id");
CREATE INDEX "api_tokens_project_id_idx" ON "api_tokens"("project_id");
CREATE INDEX "api_tokens_user_id_idx" ON "api_tokens"("user_id");
CREATE INDEX "api_tokens_expires_at_idx" ON "api_tokens"("expires_at");

ALTER TABLE "api_tokens"
  ADD CONSTRAINT "api_tokens_organization_id_fkey"
  FOREIGN KEY ("organization_id")
  REFERENCES "organizations"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "api_tokens"
  ADD CONSTRAINT "api_tokens_user_id_fkey"
  FOREIGN KEY ("user_id")
  REFERENCES "users"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "api_tokens"
  ADD CONSTRAINT "api_tokens_project_organization_fkey"
  FOREIGN KEY ("project_id", "organization_id")
  REFERENCES "projects"("id", "organization_id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
