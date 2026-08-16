UPDATE "GroupResult" AS result
SET "name" = TO_CHAR(
  result."createdAt" AT TIME ZONE 'Asia/Seoul',
  'YYYY-MM-DD'
) || ' 조 결과'
WHERE result."name" = '저장된 조 편성'
  AND NOT EXISTS (
    SELECT 1
    FROM "GroupResult" AS existing
    WHERE existing."workspaceId" = result."workspaceId"
      AND existing."name" = TO_CHAR(
        result."createdAt" AT TIME ZONE 'Asia/Seoul',
        'YYYY-MM-DD'
      ) || ' 조 결과'
  );
