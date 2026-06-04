CREATE TABLE IF NOT EXISTS shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    context_id UUID NOT NULL,
    user_id TEXT NOT NULL,
    access_level TEXT NOT NULL,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_context_shares_contexts
        FOREIGN KEY (context_id) REFERENCES contexts(id)
        ON DELETE CASCADE
);