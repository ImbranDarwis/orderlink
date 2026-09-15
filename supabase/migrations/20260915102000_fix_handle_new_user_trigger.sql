-- Fix handle_new_user trigger to gracefully handle missing or invalid role metadata
-- Prevents 500 errors during signup when role is not provided or invalid

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  incoming_role TEXT;
  final_role user_role;
  final_full_name TEXT;
BEGIN
  -- Extract metadata with safe defaults
  incoming_role := COALESCE(NEW.raw_user_meta_data->>'role', 'Retailer');
  final_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User');

  -- Validate and sanitize role against allowed enum values
  IF incoming_role IN ('Admin', 'Distributor', 'Retailer', 'Driver') THEN
    final_role := incoming_role::user_role;
  ELSE
    final_role := 'Retailer'::user_role;
  END IF;

  -- Insert profile into public.users table
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, final_full_name, final_role)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- If profile creation fails, do not block auth signup.
    -- However, log the failure so we can investigate.
    RAISE WARNING 'handle_new_user failed for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
