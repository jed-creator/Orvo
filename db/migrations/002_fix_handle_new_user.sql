-- =============================================================================
-- Fix: handle_new_user trigger
-- =============================================================================
-- The original trigger in 001_initial_schema.sql fails on user creation with
-- "Database error creating new user" (HTTP 500 from auth.v1.admin.users).
--
-- Root cause: when a SECURITY DEFINER function fires from a trigger on
-- `auth.users`, its search_path is NOT public — so the unqualified reference
-- to `user_role` (a public schema type) can fail to resolve, or the INSERT
-- into `public.profiles` encounters type mismatch on cast.
--
-- Fix:
--   1. Set an explicit search_path on the function
--   2. Fully qualify the enum type as `public.user_role`
--   3. NULLIF the empty string so the cast doesn't fail on ''
-- =============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'role', '')::public.user_role,
      'consumer'::public.user_role
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
