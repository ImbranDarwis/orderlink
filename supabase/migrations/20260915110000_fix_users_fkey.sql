-- Fix users table foreign key constraint
-- The AFTER INSERT trigger fires before the auth.users transaction commits,
-- causing FK violation. Solution: Drop and recreate without IMMEDIATE constraint.

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Recreate with DEFERRABLE so trigger can insert before auth.users commits
ALTER TABLE public.users 
  ADD CONSTRAINT users_id_fkey 
  FOREIGN KEY (id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE 
  DEFERRABLE INITIALLY DEFERRED;
