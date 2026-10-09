ALTER TABLE answers
    DROP COLUMN team,
    DROP COLUMN form_id,
    DROP COLUMN function_id,
    DROP COLUMN question,
    ADD CONSTRAINT fk_answers_contexts
        FOREIGN KEY (context_id) REFERENCES contexts(id)
        ON DELETE SET NULL;

ALTER TABLE comments
    DROP COLUMN team,
    DROP COLUMN form_id,
    DROP COLUMN function_id,
    ADD CONSTRAINT fk_comments_contexts
        FOREIGN KEY (context_id) REFERENCES contexts(id)
        ON DELETE SET NULL;