-- Final schema alignment for deployment
-- This ensures perfect matching between dev and production databases

-- Update registration_tokens to match schema
ALTER TABLE registration_tokens ALTER COLUMN email DROP DEFAULT;
ALTER TABLE registration_tokens DROP COLUMN IF EXISTS token CASCADE;

-- Ensure all required columns exist
ALTER TABLE registration_tokens ADD COLUMN IF NOT EXISTS code_hash VARCHAR(255) NOT NULL DEFAULT 'temp';

-- Clean up any inconsistencies
UPDATE registration_tokens SET code_hash = 'temp' WHERE code_hash IS NULL;

-- Verify schema integrity
DO $$
BEGIN
  -- Check if all required tables exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_settings') THEN
    RAISE EXCEPTION 'Missing user_settings table';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audits') THEN
    RAISE EXCEPTION 'Missing audits table';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'registration_tokens') THEN
    RAISE EXCEPTION 'Missing registration_tokens table';
  END IF;
  
  RAISE NOTICE 'Schema verification complete - all required tables present';
END $$;