ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS shadow_pact jsonb;
CREATE TABLE public.room_player_seats (
 room_code text NOT NULL REFERENCES public.rooms(code) ON DELETE CASCADE,
 player_id text NOT NULL,
 token_hash text NOT NULL,
 PRIMARY KEY(room_code, player_id),
 UNIQUE(room_code, token_hash)
);
GRANT ALL ON public.room_player_seats TO service_role;
ALTER TABLE public.room_player_seats ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.room_player_seats FROM anon, authenticated;
CREATE OR REPLACE FUNCTION public.room_gateway(_op text, _code text, _token text, _data jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'pg_catalog','public' AS $function$
DECLARE r public.rooms; role_name text; token_digest text; result jsonb; seat text; candidate text; answer boolean;
BEGIN
 IF _code !~ '^[A-Z]{4,8}$' OR _token !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Access denied'; END IF;
 token_digest := encode(sha256(convert_to(_token,'UTF8')),'hex');
 IF _op='create' THEN
  IF _data->>'channel' !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Invalid request'; END IF;
  INSERT INTO public.rooms(code,state,channel_id) VALUES (_code,_data->'state',_data->>'channel');
  INSERT INTO public.room_access VALUES(token_digest,_code,'master');
  RETURN jsonb_build_object('channel',_data->>'channel');
 END IF;
 SELECT * INTO r FROM public.rooms WHERE code=_code;
 IF NOT FOUND OR r.channel_id IS NULL THEN RETURN NULL; END IF;
 IF _op='join' THEN
  INSERT INTO public.room_access VALUES(token_digest,_code,'player');
  RETURN jsonb_build_object('channel',r.channel_id);
 END IF;
 SELECT access_role INTO role_name FROM public.room_access WHERE room_code=_code AND token_hash=token_digest;
 IF role_name IS NULL THEN RAISE EXCEPTION 'Access denied'; END IF;
 IF _op='read' THEN
  result := jsonb_build_object('state',r.state,'updated_at',r.updated_at,'channel',r.channel_id);
  IF role_name='master' THEN result := result || jsonb_build_object('privatePact',r.shadow_pact); END IF;
  RETURN result;
 END IF;
 IF _op IN ('write','actions','prune','pactOpen') AND role_name<>'master' THEN RAISE EXCEPTION 'Access denied'; END IF;
 IF _op IN ('pact','pactAnswer') THEN
  IF role_name='master' AND _op='pact' THEN RETURN r.shadow_pact; END IF;
  SELECT player_id INTO seat FROM public.room_player_seats WHERE room_code=_code AND token_hash=token_digest;
  IF seat IS NULL OR r.shadow_pact->>'playerId' IS DISTINCT FROM seat THEN RETURN NULL; END IF;
  IF _op='pactAnswer' THEN
   IF r.state->'curse'->>'stage' IS DISTINCT FROM 'awake' OR r.shadow_pact->>'answered'='true' OR jsonb_typeof(_data->'accept') IS DISTINCT FROM 'boolean' THEN RAISE EXCEPTION 'Invalid request'; END IF;
   answer := (_data->>'accept')::boolean;
   UPDATE public.rooms SET shadow_pact=shadow_pact || jsonb_build_object('accepted',answer,'answered',true) WHERE code=_code AND coalesce(shadow_pact->>'answered','false')='false' RETURNING shadow_pact INTO result;
   RETURN result;
  END IF;
  RETURN r.shadow_pact;
 END IF;
 IF _op='pactOpen' THEN
  IF r.shadow_pact IS NOT NULL THEN RETURN r.shadow_pact; END IF;
  IF r.state->>'city' IS DISTINCT FROM 'esquecidos' OR r.state->>'phase' IS DISTINCT FROM 'playing' OR r.state->'horrorOptions'->>'pact' IS DISTINCT FROM 'true' OR r.state->'curse'->>'stage' IS DISTINCT FROM 'awake' OR (extract(epoch from clock_timestamp())*1000) < (r.state->'curse'->>'awakenedAt')::numeric + 360000 THEN RETURN NULL; END IF;
  SELECT p->>'id' INTO candidate FROM jsonb_array_elements(r.state->'players') p JOIN public.room_player_seats b ON b.room_code=_code AND b.player_id=p->>'id' WHERE coalesce(p->>'out','false')='false' ORDER BY (p->>'balance')::numeric, p->>'id' LIMIT 1;
  IF candidate IS NULL THEN RETURN NULL; END IF;
  UPDATE public.rooms SET shadow_pact=jsonb_build_object('playerId',candidate,'accepted',false,'answered',false) WHERE code=_code AND shadow_pact IS NULL RETURNING shadow_pact INTO result;
  RETURN result;
 END IF;
 IF _op='write' THEN
  UPDATE public.rooms SET state=_data->'state',updated_at=clock_timestamp() WHERE code=_code;
  RETURN jsonb_build_object('ok',true);
 ELSIF _op='actions' THEN
  SELECT coalesce(jsonb_agg(a),'[]'::jsonb) INTO result FROM (SELECT id,player_id,type,payload,created_at FROM public.actions WHERE room_code=_code AND (_data->>'since' IS NULL OR created_at>=(_data->>'since')::timestamptz) ORDER BY created_at LIMIT 200) a;
  RETURN result;
 ELSIF _op='send' THEN
  IF length(_data->>'type') NOT BETWEEN 1 AND 39 OR length(_data->>'player_id') NOT BETWEEN 1 AND 100 OR _data->>'type' IN ('kick','skipTurn','autoResolve','horrorTick','dismissAuction','configureHorror','pactOpen','pactAnswer') OR octet_length(_data::text)>16384 THEN RAISE EXCEPTION 'Invalid request'; END IF;
  IF _data->>'type'='join' AND r.state->>'phase'='lobby' AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(r.state->'players') p WHERE p->>'id'=_data->>'player_id') THEN
   INSERT INTO public.room_player_seats(room_code,player_id,token_hash) VALUES(_code,_data->>'player_id',token_digest) ON CONFLICT DO NOTHING;
  END IF;
  INSERT INTO public.actions(id,room_code,player_id,type,payload) VALUES((_data->>'id')::uuid,_code,_data->>'player_id',_data->>'type',coalesce(_data->'payload','{}'::jsonb)) ON CONFLICT(id) DO NOTHING;
  RETURN jsonb_build_object('ok',true);
 ELSIF _op='prune' THEN
  DELETE FROM public.actions WHERE room_code=_code AND (r.state->>'phase'='over' OR created_at<now()-interval '10 minutes');
  RETURN jsonb_build_object('ok',true);
 END IF;
 RAISE EXCEPTION 'Invalid request';
END $function$;
REVOKE ALL ON FUNCTION public.room_gateway(text,text,text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.room_gateway(text,text,text,jsonb) TO anon, authenticated, service_role;