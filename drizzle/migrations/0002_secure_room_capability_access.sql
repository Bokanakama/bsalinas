CREATE TABLE public.room_access (
 token_hash text PRIMARY KEY,
 room_code text NOT NULL REFERENCES public.rooms(code) ON DELETE CASCADE,
 access_role text NOT NULL CHECK (access_role IN ('master','player'))
);
GRANT ALL ON public.room_access TO service_role;
ALTER TABLE public.room_access ENABLE ROW LEVEL SECURITY;
CREATE INDEX room_access_room_idx ON public.room_access(room_code);
ALTER TABLE public.rooms ADD COLUMN channel_id text DEFAULT NULL;
ALTER POLICY "actions read" ON public.actions USING (false);
ALTER POLICY "rooms read" ON public.rooms USING (false);
ALTER POLICY "rooms update" ON public.rooms USING (false) WITH CHECK (false);
REVOKE ALL ON public.rooms, public.actions FROM anon, authenticated;
GRANT ALL ON public.rooms, public.actions TO service_role;
CREATE FUNCTION public.room_gateway(_op text, _code text, _token text, _data jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE r public.rooms; role_name text; token_digest text; result jsonb;
BEGIN
 IF _code !~ '^[A-Z]{4,8}$' OR _token !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Access denied'; END IF;
 token_digest := encode(sha256(convert_to(_token, 'UTF8')), 'hex');
 IF _op = 'create' THEN
  IF _data->>'channel' !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Invalid request'; END IF;
  INSERT INTO public.rooms(code, state, channel_id) VALUES (_code, _data->'state', _data->>'channel');
  INSERT INTO public.room_access VALUES (token_digest, _code, 'master');
  RETURN jsonb_build_object('channel', _data->>'channel');
 END IF;
 SELECT * INTO r FROM public.rooms WHERE code = _code;
 IF NOT FOUND OR r.channel_id IS NULL THEN RETURN NULL; END IF;
 IF _op = 'join' THEN
  INSERT INTO public.room_access VALUES (token_digest, _code, 'player');
  RETURN jsonb_build_object('channel', r.channel_id);
 END IF;
 SELECT access_role INTO role_name FROM public.room_access WHERE room_code = _code AND token_hash = token_digest;
 IF role_name IS NULL THEN RAISE EXCEPTION 'Access denied'; END IF;
 IF _op = 'read' THEN
  RETURN jsonb_build_object('state', r.state, 'updated_at', r.updated_at, 'channel', r.channel_id);
 END IF;
 IF _op IN ('write','actions','prune') AND role_name <> 'master' THEN RAISE EXCEPTION 'Access denied'; END IF;
 IF _op = 'write' THEN
  UPDATE public.rooms SET state = _data->'state', updated_at = clock_timestamp() WHERE code = _code;
  RETURN jsonb_build_object('ok', true);
 ELSIF _op = 'actions' THEN
  SELECT coalesce(jsonb_agg(a), '[]'::jsonb) INTO result FROM (SELECT id, player_id, type, payload, created_at FROM public.actions WHERE room_code = _code AND (_data->>'since' IS NULL OR created_at >= (_data->>'since')::timestamptz) ORDER BY created_at LIMIT 200) a;
  RETURN result;
 ELSIF _op = 'send' THEN
  IF length(_data->>'type') NOT BETWEEN 1 AND 39 OR length(_data->>'player_id') NOT BETWEEN 1 AND 100 OR _data->>'type' IN ('kick','skipTurn','autoResolve') OR octet_length(_data::text) > 16384 THEN RAISE EXCEPTION 'Invalid request'; END IF;
  INSERT INTO public.actions(id, room_code, player_id, type, payload) VALUES ((_data->>'id')::uuid, _code, _data->>'player_id', _data->>'type', coalesce(_data->'payload','{}'::jsonb)) ON CONFLICT (id) DO NOTHING;
  RETURN jsonb_build_object('ok',true);
 ELSIF _op = 'prune' THEN
  DELETE FROM public.actions WHERE room_code = _code AND (r.state->>'phase' = 'over' OR created_at < now() - interval '10 minutes');
  RETURN jsonb_build_object('ok',true);
 END IF;
 RAISE EXCEPTION 'Invalid request';
END $$;
REVOKE ALL ON FUNCTION public.room_gateway(text,text,text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.room_gateway(text,text,text,jsonb) TO anon, authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.prune_room_actions(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prune_room_actions(text) TO service_role;