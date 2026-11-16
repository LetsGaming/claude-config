# discord.js best practices

discord.js-specific rules (**discord.js 14**, Discord API v10, TypeScript) that sit **on top of**
`backend-apis.md` and `external-integrations.md`. A bot is an event-driven service: an interaction is
a request, a slash command is a route, and the Discord gateway/REST is an upstream. The general rules
(thin handlers over a service layer, validate at the boundary, one error handler, config-once,
ports/adapters for upstreams, degrade-don't-fail) are the whole job here; this file names how they
land in discord.js and adds Discord-only concerns (read `types-and-contracts.md` too). Applies
whenever touching commands, events, or client setup.

## Slash commands, minimal intents

- **Application (slash) commands, not message-content parsing.** Reading message text needs the
  privileged Message Content intent and is being retired for general bots: build on interactions.
- **Request only the intents a command actually uses.** Extra intents cost memory and gateway
  pressure, and privileged ones (Message Content, Members, Presence) need Dev-Portal toggles plus
  verification past 100 guilds. Same discipline for cache: bound `MessageManager`/`PresenceManager`
  via `makeCache`; don't cache what you never read.

## A command is a thin handler over a service

- **The command body validates options, calls a service, and shapes the reply**: no business rules,
  no raw DB/`fetch`. Decisions live in services; data access in a repository returning domain types;
  Discord REST/OAuth and other upstreams behind an adapter that returns typed failures, not throws
  (`backend-apis.md`, `external-integrations.md`). A rule-bearing branch or a bare `fetch` in a
  command is on the wrong side of a seam.
- **One command per module, loaded into a typed registry at startup.** No god `switch` on
  `commandName`.

## One command wrapper: defer, permissions, errors

- **Wrap every slash command in one middleware** that defers within the ~3s window when the work
  isn't instant, runs the permission/admin gate **fail-closed**, and translates thrown typed failures
  into one consistent reply. Don't hand-build error replies per command: that body drifts
  (`backend-apis.md`).
- **Errors to users are ephemeral and abstract**; the stack trace is logged server-side, never shown.

## Register commands out-of-band

- **Registering (`REST.put` to application/guild commands) is separate from defining, and is
  rate-limited.** Do it in a deploy step or behind a guarded owner command: never re-sync on every
  boot. Guild-scoped for dev (instant), global for release (slow propagation).

## Interactions: acknowledge once, then follow up

- **Defer before any DB/network/CPU work** (`deferReply`), then `editReply`/`followUp`. Respond to
  `interaction.reply` exactly once; use `followUp` after. Ephemeral for anything sensitive.
- **Use `flags: MessageFlags.Ephemeral`**: the `ephemeral: true` option is deprecated.

## Don't block the loop; share long-lived clients

- **The gateway runs one event loop.** Blocking or heavy sync work drops heartbeats and disconnects,
  everything I/O is async, offload CPU work.
- **Instantiate the DB pool, HTTP client, and Redis once and share them**: never per interaction.
  Trust the library's rate-limit queue (don't fight it with your own retries); prefer bulk operations
  and webhooks for high-volume posting.

## User-facing values and sinks

- **No magic values.** Embed colors, channel/role IDs, and limits are one `as const` source
  referenced everywhere, not raw hex/snowflakes scattered across files (`engineering-principles.md`).
  Route embeds through one builder helper.
- **One sanitizer for text bound to an external system.** Any user text sent to an RCON/shell/console
  command, another API, or a query passes one shared sanitizer/validator: never a hand-rolled second
  copy, never unvalidated interpolation into a command string.

## Config and secrets

- **Config once.** Read env once into a typed, validated config at boot (refuse a missing token);
  never scatter `process.env`. The token, like any secret, stays in env, gitignored, unlogged, and is
  rotated if leaked. Don't block the event loop reading config or on startup work.

## Red flags (refactor soon)

- Business logic or raw DB/`fetch` inside a command body.
- Message-content parsing where a slash command fits; all intents enabled "to be safe".
- Per-command error replies; no single wrapper/handler.
- Re-registering/syncing commands on every boot.
- Work before acknowledging, past the ~3s window; responding twice to `interaction.response`.
- A DB client or HTTP client created per interaction instead of shared.
- Raw hex / snowflakes / limits duplicated across files instead of one `as const`.
- Unvalidated user text interpolated into a console/shell/API string.
- Token or secrets read from scattered `process.env`, or leaked into logs.
