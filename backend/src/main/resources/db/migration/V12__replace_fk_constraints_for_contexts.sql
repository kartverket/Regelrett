ALTER TABLE answers
    DROP CONSTRAINT fk_answers_contexts,
    ADD CONSTRAINT fk_answers_contexts
        FOREIGN KEY (context_id) REFERENCES contexts(id)
        ON DELETE CASCADE;

ALTER TABLE comments
    DROP CONSTRAINT fk_comments_contexts,
    ADD CONSTRAINT fk_comments_contexts
        FOREIGN KEY (context_id) REFERENCES contexts(id)
        ON DELETE CASCADE;