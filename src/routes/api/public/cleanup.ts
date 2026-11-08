// Server-only API route called by Lovable's cron scheduler (authenticated via
// LOVABLE_CRON_SECRET) to delete rooms that have not been updated for a while,
// plus their pending actions. Lives under /api/public/ because that prefix
// bypasses site auth for external callers; the handler verifies the caller
// itself. See src/integrations/supabase/cron-auth.ts for the auth helper.
import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

// Idle rooms older than this many hours are deleted. 48h is a safe default:
// a typical session is well under this, and it still frees the database.
export const IDLE_ROOM_MS = 48 * 60 * 60 * 1000;

export const Route = createFileRoute("/api/public/cleanup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authError = await authenticateCronRequest(request);
        if (authError) return authError;

        // Route files ship to the client bundle, so the privileged client is
        // loaded only here, after the caller has been verified.
        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );

        const cutoff = new Date(Date.now() - IDLE_ROOM_MS).toISOString();
        const { data: stale, error: listErr } = await supabaseAdmin
          .from("rooms")
          .select("code")
          .lt("updated_at", cutoff)
          .limit(500);
        if (listErr) return Response.json({ error: listErr.message }, { status: 500 });
        if (!stale || stale.length === 0) return Response.json({ deleted: 0 });
        const codes: string[] = stale.map((r) => r.code as string);

        // Actions are the larger table; clear them first so a partial failure
        // can't leave orphans behind.
        const { error: delActions } = await supabaseAdmin
          .from("actions")
          .delete()
          .in("room_code", codes);
        if (delActions) return Response.json({ error: delActions.message }, { status: 500 });

        const { error: delRooms } = await supabaseAdmin
          .from("rooms")
          .delete()
          .in("code", codes);
        if (delRooms) return Response.json({ error: delRooms.message }, { status: 500 });

        return Response.json({ deleted: codes.length });
      },
    },
  },
});
