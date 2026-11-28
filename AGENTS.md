<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- Game rules live as pure functions in src/lib/game.ts; only the master page writes room state, players insert actions it processes — keeps one authority and testable rules.
- City effects use a shared absolute expiry persisted by the master; legacy round-based events are converted on load so all devices use one deadline.
- HTTP endpoints are real file routes under src/routes/api/ (external callers under api/public/) exporting createFileRoute with server.handlers; a plain exported `Route` object breaks the generated route tree and 500s every page.
- Turn timeouts and host buttons (skip/kick) are synthetic actions enqueued on the master's single action queue; their rules are pure functions in game.ts — keeps one ordered writer.
- City-selector theme overrides stay scoped to .city-portal; this isolates portal styling from all game pages.
- Room data is accessed through roomRequest and the capability-checking room_gateway RPC; direct table grants are service-only, master credentials never enter participant responses, and broadcasts are doorbells rather than trusted state or actions.
- Render legacy payment wording through paymentText without modifying stored state or action names; this preserves existing room compatibility while keeping payments entirely in-game.

- Resolve boards, cards, events and building labels from each room’s city via pure selectors; missing city means Salinas, so simultaneous cities and legacy rooms remain isolated.
- Creating a Boró room persists its city through the existing master-only gateway before opening its board; no new table or alternate room access path is needed.
- Selva-only mechanics (Onça beast, relic victory) are pure functions in game.ts gated by cityOf(s) === "selva"; other cities never receive beast/relics state.
- Auction bank financing (Player.loan) and voluntary repayment are pure functions in game.ts; repayment is a 'repayLoan' action processed by the master.

- Esquecidos is a city-gated mid-game crisis in game.ts, never a terminal ritual; master queue ticks persist randomized fog/ghost deadlines and per-player lap baselines for one reversible property pair, ritual cooldowns and property permutations with attached assets, with no hidden roles in participant-visible state — prevents cross-city changes and secret leakage.

- Property flight animations track persisted property identities with DOM snapshots, never move perimeter cells or player coordinates — preserves TV geometry and synchronized rule state.

- Room reads reuse the capability-checked opening snapshot, coalesce doorbells and use adaptive repair polling; never cache private room data across credentials — avoids redundant work without trusting broadcasts.
- State writes use independent per-room workers with bounded retries and retain dirty snapshots until acknowledged — prevents transient failures from discarding the latest state.
- Game state and curse layouts are immutable; board selectors cache resolved layouts in a WeakMap — avoids repeated validation without retaining finished rooms.
- Cover images use CDN-hosted responsive WebP variants, retaining original media for older deployments — reduces transfer without changing artwork.

- Master auction display clocks live in their own component while absolute deadlines resolve on the master queue — clock ticks must not rerender the board.
- Optional wallet dialogs load lazily with intent prefetch for trade/map — reduces initial gameplay code without removing controls.
