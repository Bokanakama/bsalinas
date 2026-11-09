ALTER TABLE public.rooms REPLICA IDENTITY FULL;
ALTER TABLE public.actions REPLICA IDENTITY FULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='rooms') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='actions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.actions; END IF;
END $$;