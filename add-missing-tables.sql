-- Add missing mcp_tools table
CREATE TABLE IF NOT EXISTS public.mcp_tools (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policy for mcp_tools
ALTER TABLE public.mcp_tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view mcp_tools" ON public.mcp_tools
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert mcp_tools" ON public.mcp_tools
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update mcp_tools" ON public.mcp_tools
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete mcp_tools" ON public.mcp_tools
    FOR DELETE USING (auth.role() = 'authenticated');

-- Insert some sample MCP tools
INSERT INTO public.mcp_tools (name, description, category, is_active) VALUES
('File Manager', 'Manage files and directories', 'system', true),
('Database Query', 'Execute database queries', 'data', true),
('API Client', 'Make HTTP requests to external APIs', 'integration', true),
('Email Sender', 'Send emails programmatically', 'communication', true),
('Image Processor', 'Process and manipulate images', 'media', true)
ON CONFLICT (id) DO NOTHING;
