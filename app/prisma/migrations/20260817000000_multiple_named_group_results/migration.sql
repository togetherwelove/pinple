ALTER TABLE "GroupResult"
ADD COLUMN "name" TEXT NOT NULL DEFAULT '저장된 조 편성';

ALTER TABLE "GroupResult"
ALTER COLUMN "name" DROP DEFAULT;

DROP INDEX IF EXISTS "GroupResult_workspaceId_key";

CREATE INDEX "GroupResult_workspaceId_idx"
ON "GroupResult"("workspaceId");

CREATE UNIQUE INDEX "GroupResult_workspaceId_name_key"
ON "GroupResult"("workspaceId", "name");
