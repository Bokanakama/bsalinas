DO $migration$
DECLARE definition text;
BEGIN
 SELECT pg_get_functiondef(p.oid) INTO definition FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='room_gateway';
 definition := replace(definition, '''prune'',''pactOpen'') AND role_name', '''prune'',''pactOpen'',''pactClose'') AND role_name');
 definition := replace(definition, 'IF _op IN (''pactAnswer'',''pactOpen'') THEN', 'IF _op=''pactClose'' THEN UPDATE public.rooms SET shadow_pact=shadow_pact || jsonb_build_object(''closed'',true) WHERE code=_code AND shadow_pact IS NOT NULL RETURNING shadow_pact INTO result; RETURN result; END IF; IF _op IN (''pactAnswer'',''pactOpen'') THEN');
 definition := replace(definition, 'r.shadow_pact->>''answered''=''true'' OR', '(r.shadow_pact->>''answered''=''true'' OR r.shadow_pact->>''closed''=''true'') OR');
 EXECUTE definition;
END $migration$;