ALTER TABLE "feature_flags"
DROP CONSTRAINT "feature_flags_type_check";

ALTER TABLE "feature_flags"
ADD CONSTRAINT "feature_flags_type_check"
CHECK ("type" IN ('boolean', 'string', 'integer', 'double', 'json_object', 'json_array'));
