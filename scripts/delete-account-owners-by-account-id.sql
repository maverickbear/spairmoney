-- Fix "operator does not exist: text = uuid" when deleting account_owners from JS.
-- PostgREST sends filter values as text; this function accepts uuid so the parameter is cast correctly.
-- Run in Supabase SQL Editor if account delete fails with that error.

CREATE OR REPLACE FUNCTION delete_account_owners_by_account_id(p_account_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM account_owners WHERE account_id = p_account_id::text;
$$;

COMMENT ON FUNCTION delete_account_owners_by_account_id(uuid) IS
  'Deletes all account_owners rows for the given account_id. Used by AccountsRepository.delete to avoid text=uuid operator error.';
