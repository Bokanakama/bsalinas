import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { setResponseHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { newState } from "./game";
import type { Database, Json } from "@/integrations/supabase/types";

const request = z.object({
  op: z.enum(["create", "join", "read", "write", "actions", "send", "prune"]),
  code: z.string().regex(/^[A-Z]{4,8}$/),
  token: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  payload: z.record(z.unknown()).default({}),
});

/** Database gateway validates room capabilities, never a browser's claimed role. */
export const roomRequest = createServerFn({ method: "POST" })
  .inputValidator((input: z.input<typeof request>) => request.parse(input))
  .handler(async ({ data }) => {
    setResponseHeader("Cache-Control", "no-store");
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const client = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      } },
    });
    const mint = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, "0")).join("");
    const issued = data.op === "create" || data.op === "join";
    const token = issued ? mint() : data.token;
    if (!token) throw new Error("Acesso à sala não autorizado.");
    const payload = data.op === "create" ? { state: newState(), channel: mint() } : data.payload;
    if (JSON.stringify(payload).length > 200000) throw new Error("Pedido inválido.");
    const { data: result, error } = await client.rpc("room_gateway", {
      _op: data.op, _code: data.code, _token: token, _data: payload as Json,
    });
    if (error) throw new Error(error.code === "23505" ? "Código indisponível." : "Acesso à sala não autorizado.");
    return { result, token: issued && result ? token : undefined };
  });