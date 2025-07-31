-- First, just create the clients table
CREATE TABLE IF NOT EXISTS clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    focus_areas TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);



-- Step 2: Add columns to existing tables
ALTER TABLE snippets 
ADD COLUMN IF NOT EXISTS client_id UUID,
ADD COLUMN IF NOT EXISTS is_general BOOLEAN DEFAULT true;

-- Step 3: Add foreign key constraints (using DO block for safe constraint addition)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_snippets_client_id'
    ) THEN
        ALTER TABLE snippets 
        ADD CONSTRAINT fk_snippets_client_id 
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Step 4: Add to generation_sessions
ALTER TABLE generation_sessions 
ADD COLUMN IF NOT EXISTS client_id UUID;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_generation_sessions_client_id'
    ) THEN
        ALTER TABLE generation_sessions 
        ADD CONSTRAINT fk_generation_sessions_client_id 
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Step 5: Add to composed_prompts
ALTER TABLE composed_prompts 
ADD COLUMN IF NOT EXISTS client_id UUID;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_composed_prompts_client_id'
    ) THEN
        ALTER TABLE composed_prompts 
        ADD CONSTRAINT fk_composed_prompts_client_id 
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Step 6: Create indexes
CREATE INDEX IF NOT EXISTS idx_snippets_client_id ON snippets(client_id);
CREATE INDEX IF NOT EXISTS idx_snippets_is_general ON snippets(is_general);
CREATE INDEX IF NOT EXISTS idx_generation_sessions_client_id ON generation_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_composed_prompts_client_id ON composed_prompts(client_id);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);

-- Step 7: Create trigger for clients table
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON clients 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Step 8: Enable RLS and create policy
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on clients" ON clients;
CREATE POLICY "Allow all operations on clients" ON clients FOR ALL USING (true);

-- Step 9: Create view for client snippets
DROP VIEW IF EXISTS client_snippets_view;
CREATE VIEW client_snippets_view AS
SELECT 
    s.*,
    c.name as client_name,
    c.description as client_description,
    c.focus_areas as client_focus_areas
FROM snippets s
LEFT JOIN clients c ON s.client_id = c.id;

-- Step 10: Create function for client-aware snippet queries
CREATE OR REPLACE FUNCTION get_snippets_with_client_priority(
    search_name TEXT DEFAULT NULL,
    current_client_id UUID DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    name TEXT,
    content TEXT,
    description TEXT,
    client_id UUID,
    is_general BOOLEAN,
    client_name TEXT,
    priority INTEGER,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.name,
        s.content,
        s.description,
        s.client_id,
        s.is_general,
        c.name as client_name,
        CASE 
            WHEN s.client_id = current_client_id THEN 1
            WHEN s.is_general = true THEN 2
            ELSE 3
        END as priority,
        s.created_at,
        s.updated_at
    FROM snippets s
    LEFT JOIN clients c ON s.client_id = c.id
    WHERE 
        (search_name IS NULL OR s.name ILIKE '%' || search_name || '%')
    ORDER BY priority, s.created_at DESC;
END;
$$ LANGUAGE plpgsql;