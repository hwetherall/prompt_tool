-- Snippets table - core storage for all prompt snippets
CREATE TABLE snippets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- e.g., "geo_asia_japan", "investment_SeriesB"
    content TEXT NOT NULL, -- the actual prompt snippet content
    description TEXT, -- user-provided context when creating the snippet
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generation sessions table - tracks the LLM generation process
CREATE TABLE generation_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    snippet_name TEXT NOT NULL, -- the snippet being generated
    user_context TEXT NOT NULL, -- context provided by user
    similar_snippets TEXT[], -- array of similar snippet names used as reference
    llm_responses JSONB, -- stores responses from each LLM {"claude": "...", "gpt": "...", "grok": "..."}
    final_combined TEXT, -- the final combined version from the 4th LLM
    status TEXT DEFAULT 'in_progress', -- 'in_progress', 'completed', 'cancelled'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Composed prompts table - for storing full prompts that use multiple snippets
CREATE TABLE composed_prompts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    template TEXT NOT NULL, -- e.g., "You are looking at a {{investment_SeriesB}} Investment in {{geo_asia_japan}}"
    rendered_content TEXT, -- the template with all snippets expanded
    used_snippets TEXT[], -- array of snippet names used in this prompt
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_snippets_name ON snippets(name);
CREATE INDEX idx_snippets_created_at ON snippets(created_at DESC);
CREATE INDEX idx_generation_sessions_status ON generation_sessions(status);
CREATE INDEX idx_composed_prompts_name ON composed_prompts(name);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_snippets_updated_at 
    BEFORE UPDATE ON snippets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generation_sessions_updated_at 
    BEFORE UPDATE ON generation_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_composed_prompts_updated_at 
    BEFORE UPDATE ON composed_prompts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (good practice even for simple apps)
ALTER TABLE snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE composed_prompts ENABLE ROW LEVEL SECURITY;

-- Simple policies (since no auth, allow all operations)
CREATE POLICY "Allow all operations on snippets" ON snippets FOR ALL USING (true);
CREATE POLICY "Allow all operations on generation_sessions" ON generation_sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations on composed_prompts" ON composed_prompts FOR ALL USING (true);