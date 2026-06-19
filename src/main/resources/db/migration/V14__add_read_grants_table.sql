CREATE TABLE IF NOT EXISTS read_grants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    context_id UUID NOT NULL,
    user_id TEXT NOT NULL,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    justification TEXT NOT NULL,
    shared_by TEXT NOT NULL,
    CONSTRAINT fk_context_read_grants_contexts
        FOREIGN KEY (context_id) REFERENCES contexts(id)
        ON DELETE CASCADE
);