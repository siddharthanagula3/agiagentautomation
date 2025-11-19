-- Add chat folders support
-- Migration: 20251119000001_add_chat_folders.sql
-- Allows users to organize chat sessions into folders

-- Create chat_folders table
CREATE TABLE IF NOT EXISTS public.chat_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  color VARCHAR(50) DEFAULT 'gray',
  icon VARCHAR(50) DEFAULT 'folder',
  description TEXT,
  parent_folder_id UUID REFERENCES public.chat_folders(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT chat_folders_name_user_unique UNIQUE(user_id, name, parent_folder_id),
  CONSTRAINT chat_folders_no_self_parent CHECK (id != parent_folder_id)
);

-- Add folder_id to chat_sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'chat_sessions'
    AND column_name = 'folder_id'
  ) THEN
    ALTER TABLE public.chat_sessions ADD COLUMN folder_id UUID REFERENCES public.chat_folders(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_folders_user_id ON public.chat_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_folders_parent_folder_id ON public.chat_folders(parent_folder_id) WHERE parent_folder_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_sessions_folder_id ON public.chat_sessions(folder_id) WHERE folder_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.chat_folders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_folders
-- Users can only see their own folders
CREATE POLICY "Users can view their own folders"
  ON public.chat_folders
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own folders
CREATE POLICY "Users can create their own folders"
  ON public.chat_folders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own folders
CREATE POLICY "Users can update their own folders"
  ON public.chat_folders
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own folders
CREATE POLICY "Users can delete their own folders"
  ON public.chat_folders
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE public.chat_folders IS 'User-created folders for organizing chat sessions';
COMMENT ON COLUMN public.chat_folders.id IS 'Unique folder identifier';
COMMENT ON COLUMN public.chat_folders.user_id IS 'Owner of the folder';
COMMENT ON COLUMN public.chat_folders.name IS 'Folder display name';
COMMENT ON COLUMN public.chat_folders.color IS 'Folder color (gray, blue, green, red, purple, etc.)';
COMMENT ON COLUMN public.chat_folders.icon IS 'Folder icon identifier';
COMMENT ON COLUMN public.chat_folders.description IS 'Optional folder description';
COMMENT ON COLUMN public.chat_folders.parent_folder_id IS 'Parent folder for nested folder structure';
COMMENT ON COLUMN public.chat_folders.sort_order IS 'Display order within parent folder';
COMMENT ON COLUMN public.chat_sessions.folder_id IS 'Folder containing this chat session';

-- Create function to update folder updated_at timestamp
CREATE OR REPLACE FUNCTION update_chat_folder_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_chat_folder_updated_at ON public.chat_folders;
CREATE TRIGGER trigger_update_chat_folder_updated_at
  BEFORE UPDATE ON public.chat_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_folder_updated_at();

-- Create RPC function to move session to folder
CREATE OR REPLACE FUNCTION move_session_to_folder(
  p_session_id UUID,
  p_folder_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Verify session belongs to user
  IF NOT EXISTS (
    SELECT 1 FROM public.chat_sessions
    WHERE id = p_session_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Session not found or access denied';
  END IF;

  -- Verify folder belongs to user (if folder_id provided)
  IF p_folder_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.chat_folders
    WHERE id = p_folder_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Folder not found or access denied';
  END IF;

  -- Update session folder
  UPDATE public.chat_sessions
  SET folder_id = p_folder_id,
      updated_at = NOW()
  WHERE id = p_session_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on RPC function
GRANT EXECUTE ON FUNCTION move_session_to_folder(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION move_session_to_folder IS 'Safely move a chat session to a folder with permission checks';
