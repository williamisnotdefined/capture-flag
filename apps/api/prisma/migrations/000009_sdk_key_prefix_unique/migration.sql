DROP INDEX "sdk_keys_key_prefix_idx";

CREATE UNIQUE INDEX "sdk_keys_key_prefix_key" ON "sdk_keys"("key_prefix");
