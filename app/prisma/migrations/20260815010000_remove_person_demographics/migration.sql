WITH ranked_people AS (
    SELECT
        "id",
        ROW_NUMBER() OVER (
            PARTITION BY "workspaceId", "name"
            ORDER BY "createdAt" DESC, "id" DESC
        ) AS duplicate_rank
    FROM "Person"
)
DELETE FROM "Person"
WHERE "id" IN (
    SELECT "id"
    FROM ranked_people
    WHERE duplicate_rank > 1
);

DROP INDEX IF EXISTS "Person_workspaceId_name_gender_age_key";

ALTER TABLE "Person"
    DROP COLUMN "gender",
    DROP COLUMN "age";

CREATE UNIQUE INDEX "Person_workspaceId_name_key"
ON "Person"("workspaceId", "name");

UPDATE "GroupResult" AS result
SET "members" = jsonb_strip_nulls(
    jsonb_build_object(
        'groups',
        COALESCE(
            (
                SELECT jsonb_agg(
                    (group_entry - 'members') ||
                    jsonb_build_object(
                        'members',
                        COALESCE(
                            (
                                SELECT jsonb_agg(member_entry - 'age' - 'gender')
                                FROM jsonb_array_elements(
                                    COALESCE(group_entry -> 'members', '[]'::jsonb)
                                ) AS member_entry
                            ),
                            '[]'::jsonb
                        )
                    )
                )
                FROM jsonb_array_elements(
                    COALESCE(result."members" -> 'groups', '[]'::jsonb)
                ) AS group_entry
            ),
            '[]'::jsonb
        ),
        'leaderSelectionMode', result."members" -> 'leaderSelectionMode',
        'unassigned',
        CASE
            WHEN result."members" ? 'unassigned' THEN
                COALESCE(
                    (
                        SELECT jsonb_agg(member_entry - 'age' - 'gender')
                        FROM jsonb_array_elements(
                            COALESCE(result."members" -> 'unassigned', '[]'::jsonb)
                        ) AS member_entry
                    ),
                    '[]'::jsonb
                )
            ELSE NULL
        END
    )
);
