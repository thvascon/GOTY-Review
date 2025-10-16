-- Migration to support multiple groups per user
-- This allows users to be in multiple groups simultaneously

-- Step 1: Create user_groups junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS user_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT false, -- Only one group can be active at a time per user
  UNIQUE(user_id, group_id) -- Prevent duplicate entries
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS user_groups_user_id_idx ON user_groups(user_id);
CREATE INDEX IF NOT EXISTS user_groups_group_id_idx ON user_groups(group_id);
CREATE INDEX IF NOT EXISTS user_groups_active_idx ON user_groups(user_id, is_active);

-- Step 3: Enable Row Level Security
ALTER TABLE user_groups ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
CREATE POLICY "Users can view their own group memberships"
  ON user_groups FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own group memberships"
  ON user_groups FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own group memberships"
  ON user_groups FOR UPDATE
  USING (user_id = auth.uid());

-- Step 5: Migrate existing data from people.group_id to user_groups
-- This preserves existing group associations
INSERT INTO user_groups (user_id, group_id, is_active)
SELECT p.user_id, p.group_id, true
FROM people p
WHERE p.group_id IS NOT NULL AND p.user_id IS NOT NULL
ON CONFLICT (user_id, group_id) DO NOTHING;

-- Step 6: Add active_group_id to people table for quick access
ALTER TABLE people ADD COLUMN IF NOT EXISTS active_group_id UUID REFERENCES groups(id) ON DELETE SET NULL;

-- Step 7: Set active_group_id to current group_id
UPDATE people SET active_group_id = group_id WHERE group_id IS NOT NULL;

-- Step 8: Create function to switch active group
CREATE OR REPLACE FUNCTION switch_active_group(p_group_id UUID)
RETURNS void AS $$
BEGIN
  -- First, verify user is a member of the group
  IF NOT EXISTS (
    SELECT 1 FROM user_groups
    WHERE user_id = auth.uid() AND group_id = p_group_id
  ) THEN
    RAISE EXCEPTION 'User is not a member of this group';
  END IF;

  -- Set all groups for this user to inactive
  UPDATE user_groups
  SET is_active = false
  WHERE user_id = auth.uid();

  -- Set the selected group as active
  UPDATE user_groups
  SET is_active = true
  WHERE user_id = auth.uid() AND group_id = p_group_id;

  -- Update active_group_id in people table
  UPDATE people
  SET active_group_id = p_group_id
  WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Create function to get user's groups
CREATE OR REPLACE FUNCTION get_user_groups()
RETURNS TABLE (
  group_id UUID,
  group_name TEXT,
  invite_code TEXT,
  is_active BOOLEAN,
  joined_at TIMESTAMP WITH TIME ZONE,
  member_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id as group_id,
    g.name as group_name,
    g.invite_code,
    ug.is_active,
    ug.joined_at,
    (SELECT COUNT(*) FROM user_groups WHERE group_id = g.id) as member_count
  FROM user_groups ug
  JOIN groups g ON ug.group_id = g.id
  WHERE ug.user_id = auth.uid()
  ORDER BY ug.is_active DESC, ug.joined_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Create function to join group (updated to add instead of replace)
CREATE OR REPLACE FUNCTION join_group_by_code(p_invite_code TEXT)
RETURNS UUID AS $$
DECLARE
  v_group_id UUID;
  v_user_id UUID;
  v_has_active_group BOOLEAN;
BEGIN
  v_user_id := auth.uid();

  -- Find group by invite code
  SELECT id INTO v_group_id
  FROM groups
  WHERE invite_code = UPPER(p_invite_code);

  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  -- Check if user already in this group
  IF EXISTS (
    SELECT 1 FROM user_groups
    WHERE user_id = v_user_id AND group_id = v_group_id
  ) THEN
    RAISE EXCEPTION 'User is already a member of this group';
  END IF;

  -- Check if user has any active group
  SELECT EXISTS (
    SELECT 1 FROM user_groups
    WHERE user_id = v_user_id AND is_active = true
  ) INTO v_has_active_group;

  -- Insert into user_groups
  -- Set as active only if user has no active group
  INSERT INTO user_groups (user_id, group_id, is_active)
  VALUES (v_user_id, v_group_id, NOT v_has_active_group);

  -- Update active_group_id if this is the first/active group
  IF NOT v_has_active_group THEN
    UPDATE people
    SET active_group_id = v_group_id
    WHERE user_id = v_user_id;
  END IF;

  -- Keep legacy group_id in sync for backward compatibility
  IF NOT v_has_active_group THEN
    UPDATE people
    SET group_id = v_group_id
    WHERE user_id = v_user_id;
  END IF;

  RETURN v_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 11: Create view for easier querying of user's games across all groups
CREATE OR REPLACE VIEW user_all_games AS
SELECT DISTINCT
  g.id,
  g.name,
  g.cover_image,
  g.section_id,
  g.group_id,
  g.genres,
  g.rawg_id,
  g.created_at,
  s.title as section_title,
  gr.name as group_name
FROM games g
JOIN sections s ON g.section_id = s.id
JOIN groups gr ON g.group_id = gr.id
JOIN user_groups ug ON gr.id = ug.group_id
WHERE ug.user_id = auth.uid();

-- Step 12: Grant permissions on the view
GRANT SELECT ON user_all_games TO authenticated;

-- Note: We keep group_id in people table for backward compatibility
-- New code should use user_groups table and active_group_id
