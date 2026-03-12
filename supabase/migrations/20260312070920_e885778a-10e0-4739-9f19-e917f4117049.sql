
-- Fix: lookup email by phone number for login
CREATE OR REPLACE FUNCTION public.get_email_by_phone(_phone text)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email text;
BEGIN
  SELECT u.email INTO _email
  FROM auth.users u
  JOIN public.profiles p ON p.id = u.id
  WHERE p.phone = _phone
  LIMIT 1;
  RETURN _email;
END;
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION public.get_email_by_phone(text) TO anon, authenticated;
