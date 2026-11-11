CREATE OR REPLACE FUNCTION public.prune_room_actions(_code text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n integer;
  finished boolean;
BEGIN
  SELECT (state->>'phase') = 'over' INTO finished FROM public.rooms WHERE code = _code;
  IF finished THEN
    DELETE FROM public.actions WHERE room_code = _code;
  ELSE
    -- Only actions old enough to have surely been processed by the board.
    DELETE FROM public.actions WHERE room_code = _code AND created_at < now() - interval '10 minutes';
  END IF;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;
REVOKE ALL ON FUNCTION public.prune_room_actions(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.prune_room_actions(text) TO anon, authenticated, service_role;