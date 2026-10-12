ALTER TABLE answers
    ADD answer_type VARCHAR(40) NOT NULL DEFAULT 'empty',
    ADD answer_unit VARCHAR(40);

