ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_status_check') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check CHECK (status IN ('pending','approved','rejected'));
  END IF;
END $$;

UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE u.id = p.id AND p.email IS NULL;

-- existing users stay approved so nobody is locked out retroactively
UPDATE public.profiles SET status = 'approved', approved_at = now() WHERE status = 'pending';

CREATE OR REPLACE FUNCTION public.is_approved(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND status = 'approved')
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_owner boolean := lower(NEW.email) = 'osmarfln@gmail.com';
BEGIN
  INSERT INTO public.profiles (id, display_name, email, status, approved_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    CASE WHEN is_owner THEN 'approved' ELSE 'pending' END,
    CASE WHEN is_owner THEN now() ELSE NULL END
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN is_owner THEN 'admin'::app_role ELSE 'user'::app_role END)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- promote the owner account if it already exists
UPDATE public.profiles p
SET status = 'approved', approved_at = COALESCE(p.approved_at, now())
FROM auth.users u
WHERE u.id = p.id AND lower(u.email) = 'osmarfln@gmail.com';

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::app_role FROM auth.users u WHERE lower(u.email) = 'osmarfln@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- profiles policies
DROP POLICY IF EXISTS "Authenticated can view profiles" ON public.profiles;
CREATE POLICY "Users view own profile or admin views all"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- user_roles management by admins
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;