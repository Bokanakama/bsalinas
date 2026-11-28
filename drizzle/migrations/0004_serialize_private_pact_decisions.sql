DO $migration$
DECLARE definition text;
BEGIN
 SELECT pg_get_functiondef(p.oid) INTO definition FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='room_gateway';
 IF position('IF _op IN (''pact'',''pactAnswer'') THEN' in definition)=0 THEN RAISE EXCEPTION 'Gateway pattern not found'; END IF;
 definition := replace(definition, 'IF _op IN (''pact'',''pactAnswer'') THEN', 'IF _op IN (''pactAnswer'',''pactOpen'') THEN SELECT * INTO r FROM public.rooms WHERE code=_code FOR UPDATE; END IF; IF _op IN (''pact'',''pactAnswer'') THEN');
 EXECUTE definition;
END $migration$;