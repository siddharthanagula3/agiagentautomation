-- Create hired_employees table (free hire concept, no payment required)
CREATE TABLE IF NOT EXISTS hired_employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL,
  employee_name TEXT,
  hired_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, employee_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS hired_employees_user_id_idx ON hired_employees(user_id);

-- RLS
ALTER TABLE hired_employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own hired employees"
  ON hired_employees FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
