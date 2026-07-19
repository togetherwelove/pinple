-- Keep the newest group result for each project before enforcing one result per project.
DELETE FROM "GroupResult" AS older
USING "GroupResult" AS newer
WHERE older."projectId" = newer."projectId"
  AND (
    older."createdAt" < newer."createdAt"
    OR (
      older."createdAt" = newer."createdAt"
      AND older."id"::text < newer."id"::text
    )
  );

DROP INDEX IF EXISTS "GroupResult_projectId_createdAt_idx";

CREATE UNIQUE INDEX "GroupResult_projectId_key"
ON "GroupResult"("projectId");
