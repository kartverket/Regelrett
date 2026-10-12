ALTER TABLE answers
    ADD context_id uuid;

ALTER TABLE comments
    ADD context_id uuid;