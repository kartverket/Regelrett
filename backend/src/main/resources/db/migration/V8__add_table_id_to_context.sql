ALTER TABLE contexts
    ADD COLUMN table_id VARCHAR(50) NOT NULL DEFAULT 'empty',
    ADD CONSTRAINT unique_team_id_name UNIQUE (team_id, name);