ALTER TABLE contexts
    DROP CONSTRAINT unique_team_id_name;

ALTER TABLE contexts
    ADD CONSTRAINT unique_team_id_name_table_id UNIQUE (team_id, name, table_id);