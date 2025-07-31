-- Add clients table
CREATE TABLE clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- e.g., "Texas Medical Centre"
    description TEXT, -- Description of the client and their specific needs
    focus_areas TEXT[], -- Array of focus areas like ["Regulatory Environments", "FDA Approval", "Manufacturing Partners"]
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add client_id to snippets table
ALTER TABLE snippets 
ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
ADD COLUMN is_general BOOLEAN DEFAULT true; -- true for general snippets, false for client-specific

-- Update is_general based on client_id
UPDATE snippets SET is_general = false WHERE client_id IS NOT NULL;

-- Add client_id to generation_sessions table
ALTER TABLE generation_sessions 
ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE CASCADE;

-- Add client_id to composed_prompts table
ALTER TABLE composed_prompts 
ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE CASCADE;

-- Create indexes for client-based queries
CREATE INDEX idx_snippets_client_id ON snippets(client_id);
CREATE INDEX idx_snippets_is_general ON snippets(is_general);
CREATE INDEX idx_generation_sessions_client_id ON generation_sessions(client_id);
CREATE INDEX idx_composed_prompts_client_id ON composed_prompts(client_id);
CREATE INDEX idx_clients_name ON clients(name);

-- Update trigger for clients table
CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON clients 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for clients table
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create policy for clients table
CREATE POLICY "Allow all operations on clients" ON clients FOR ALL USING (true);

-- Create a view for client snippets with client info
CREATE VIEW client_snippets_view AS
SELECT 
    s.*,
    c.name as client_name,
    c.description as client_description,
    c.focus_areas as client_focus_areas
FROM snippets s
LEFT JOIN clients c ON s.client_id = c.id;

-- Function to get snippets with client context
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
            WHEN s.client_id = current_client_id THEN 1  -- Highest priority for same client
            WHEN s.is_general = true THEN 2              -- General snippets
            ELSE 3                                        -- Other clients' snippets
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