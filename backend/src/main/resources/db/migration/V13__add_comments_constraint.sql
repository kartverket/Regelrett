DELETE FROM comments
WHERE id IN (
    SELECT id
    FROM (
             SELECT id,
                    record_id,
                    context_id,
                    created,
                    ROW_NUMBER() OVER (PARTITION BY record_id, context_id ORDER BY created DESC) AS rn
             FROM comments
         ) AS duplicates
    WHERE rn > 1
);

ALTER TABLE comments
    ADD CONSTRAINT unique_comments UNIQUE (record_id, context_id)