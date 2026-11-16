# discord.py best practices

discord.py-specific rules (**discord.py 2.7+**, Python 3.11+) that sit **on top of** `backend-apis.md`
and `external-integrations.md`. Same framing as `discordjs.md`: a bot is an event-driven service, an
interaction is a request, a slash command is a route, the gateway/REST is an upstream. The general
rules: thin handlers over services, boundary validation, one error handler, config-once,
ports/adapters, degrade-don't-fail: are the job; this names how they land in discord.py and adds
Discord-only concerns. Applies whenever touching cogs, commands, events, or client setup.

## Slash commands, minimal intents

- **`app_commands` (slash), not `on_message` text parsing.** Message content is a privileged intent
  being retired for general bots: build on interactions.
- **`discord.Intents.default()` plus only the privileged intents you use**, toggled in the Dev Portal
  (verification past 100 guilds). Bound the message cache (`max_messages`), and set
  `chunk_guilds_at_startup=False` when you don't need the full member list.

## A command is a thin handler; logic in services, grouped in cogs

- **The command coroutine validates options, calls a service, and responds**: no business rules, no
  raw DB/`fetch`. Group related commands in a **Cog** (the module seam); logic lives in plain
  services/functions the cog calls, data access in a repository returning domain types, and upstreams
  behind an adapter returning typed failures (`backend-apis.md`, `external-integrations.md`).
- **`app_commands.command` inside cogs; `async def setup(bot)` is the extension entrypoint.** No god
  cog holding every command.

## `setup_hook` + out-of-band sync

- **Do async startup in `setup_hook`, not at import time**: load extensions, create clients, sync.
- **`tree.sync()` is rate-limited: never sync on every boot.** Guild-scoped for dev (instant), global
  for release (slow propagation); guard the global sync behind a flag or owner command.

## One tree error handler; acknowledge once

- **Register `@bot.tree.error`** (or per-cog `cog_app_command_error`) to translate typed failures into
  one consistent ephemeral reply: don't repeat error handling per command. Log detail server-side,
  show the user an abstract message.
- **Defer before slow work** (`interaction.response.defer()`), then `interaction.followup.send()`.
  Respond to `interaction.response` once; `ephemeral=True` for sensitive replies.

## Don't block the loop; share clients

- **One asyncio loop.** Never call blocking/sync I/O in a handler (`requests`, a sync DB driver,
  `time.sleep`): it stalls the gateway and drops heartbeats. Use async drivers (`asyncpg`, `aiohttp`,
  `motor`) and `asyncio.to_thread` for unavoidable CPU work.
- **Create the `aiohttp.ClientSession` and DB pool once in `setup_hook`, close them in `close()`**: never per interaction. Trust the library's rate-limit handling; prefer bulk operations/webhooks for
  volume.

## Types, values, sinks

- **Type every handler** (`interaction: discord.Interaction`, `-> None`) and run **pyright**,
  discord.py ships typed. Constrain choices with `Literal` / `app_commands.Choice`, not loose strings.
- **No magic values.** Embed colors, IDs, and limits as one module-level constant/enum referenced
  everywhere (`engineering-principles.md`). Any user text bound for an external system passes one
  shared sanitizer/validator: never a hand-rolled second copy.

## Config and secrets

- **Config once.** Load env once into a typed, validated config at boot (refuse a missing token);
  never scatter `os.environ`. Token/secrets in env, gitignored, unlogged, rotated if leaked.

## Red flags (refactor soon)

- Business logic or raw DB/`fetch` inside a command coroutine.
- `on_message` parsing where a slash command fits; all intents on "to be safe".
- Per-command error handling; no `tree.error` / cog handler.
- Blocking calls (`requests`, a sync driver, `time.sleep`) inside an async handler.
- `tree.sync()` on every boot; startup work at import time instead of `setup_hook`.
- A session or DB client created per interaction instead of once in `setup_hook`/`close`.
- Raw colors / snowflakes / limits duplicated instead of one constant.
- Unvalidated user text interpolated into a console/shell/API string.
- Token/secrets from scattered `os.environ`, or leaked to logs.
