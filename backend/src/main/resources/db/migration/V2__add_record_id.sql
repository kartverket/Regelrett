ALTER TABLE answers
    ADD record_id VARCHAR(40) NOT NULL DEFAULT 'empty';

ALTER TABLE comments
    ADD record_id VARCHAR(40) NOT NULL DEFAULT 'empty';