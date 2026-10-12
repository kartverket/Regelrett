CREATE SCHEMA IF NOT EXISTS regelrett;

CREATE TABLE IF NOT EXISTS answers
(
    id SERIAL PRIMARY KEY,
    actor TEXT,
    question TEXT,
    answer TEXT,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    question_id VARCHAR,
    team TEXT,
    form_id TEXT
    );

CREATE TABLE IF NOT EXISTS comments
(
    id SERIAL PRIMARY KEY,
    actor TEXT,
    question_id TEXT,
    comment TEXT,
    team TEXT,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    form_id TEXT
    );
