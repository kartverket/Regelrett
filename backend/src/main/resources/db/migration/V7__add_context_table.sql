CREATE TABLE IF NOT EXISTS contexts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      team_id TEXT NOT NULL,
      name TEXT NOT NULL
);