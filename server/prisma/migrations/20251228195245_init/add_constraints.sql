-- ============================================
-- ADD CHECK CONSTRAINTS
-- ============================================

-- User constraints
ALTER TABLE users
  ADD CONSTRAINT check_username_length 
    CHECK (LENGTH(username) >= 3),
  ADD CONSTRAINT check_email_format 
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Message constraints
ALTER TABLE messages
  ADD CONSTRAINT check_content_not_empty 
    CHECK (LENGTH(TRIM(content)) > 0),
  ADD CONSTRAINT check_content_length 
    CHECK (LENGTH(content) <= 10000);

-- Conversation constraints
ALTER TABLE conversations
  ADD CONSTRAINT check_group_has_name 
    CHECK ((is_group = false) OR (is_group = true AND name IS NOT NULL));

-- ============================================
-- ADD TRIGGER FOR CONVERSATION TIMESTAMP
-- ============================================

CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_timestamp
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();

-- ============================================
-- ADD FUNCTION TO GET/CREATE CONVERSATION
-- ============================================

CREATE OR REPLACE FUNCTION get_or_create_direct_conversation(
  user1_id INT,
  user2_id INT
)
RETURNS INT AS $$
DECLARE
  conv_id INT;
  temp_id INT;
BEGIN
  IF user1_id IS NULL OR user2_id IS NULL THEN
    RAISE EXCEPTION 'User IDs cannot be NULL';
  END IF;
  
  IF user1_id = user2_id THEN
    RAISE EXCEPTION 'Cannot create conversation with yourself';
  END IF;

  IF user1_id > user2_id THEN
    temp_id := user1_id;
    user1_id := user2_id;
    user2_id := temp_id;
  END IF;

  SELECT cm1.conversation_id INTO conv_id
  FROM conversation_members cm1
  JOIN conversation_members cm2 
    ON cm1.conversation_id = cm2.conversation_id
  JOIN conversations c 
    ON c.id = cm1.conversation_id
  WHERE cm1.user_id = user1_id
    AND cm2.user_id = user2_id
    AND c.is_group = false
  LIMIT 1;

  IF conv_id IS NOT NULL THEN
    RETURN conv_id;
  END IF;

  INSERT INTO conversations (is_group, created_by)
  VALUES (false, user1_id)
  RETURNING id INTO conv_id;

  INSERT INTO conversation_members (conversation_id, user_id, role)
  VALUES 
    (conv_id, user1_id, 'member'),
    (conv_id, user2_id, 'member');

  RETURN conv_id;
END;
$$ LANGUAGE plpgsql;