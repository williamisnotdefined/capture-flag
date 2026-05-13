UPDATE "feature_flags" "ff"
SET "initial_default_value" = COALESCE(
  (
    SELECT "ffev"."default_value"
    FROM "feature_flag_environment_values" "ffev"
    INNER JOIN "environments" "e"
      ON "e"."id" = "ffev"."environment_id"
    WHERE "ffev"."feature_flag_id" = "ff"."id"
    ORDER BY "e"."sort_order" ASC, "ffev"."created_at" ASC, "ffev"."id" ASC
    LIMIT 1
  ),
  CASE "ff"."type"
    WHEN 'boolean' THEN to_jsonb(false)
    WHEN 'string' THEN to_jsonb(''::text)
    ELSE to_jsonb(0)
  END
)
WHERE "ff"."initial_default_value" IS NULL;
