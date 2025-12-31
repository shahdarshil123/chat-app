-- Disable triggers temporarily (safe for dev)
SET session_replication_role = replica;

TRUNCATE TABLE
  "messages",
  "conversation_members",
  "conversations",
  "users"
RESTART IDENTITY CASCADE;

SET session_replication_role = DEFAULT;
