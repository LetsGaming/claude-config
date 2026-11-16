# claude-config

Personal Claude Code setup. This repo is `~/.claude`.

## What is in it

| Path | Holds |
|---|---|
| `CLAUDE.md` | Global instructions |
| `settings.json` | Hooks, env, model, plugin list, marketplaces, skill overrides |
| `agents/`, `commands/`, `hooks/`, `tools/`, `_templates/` | Subagents, slash commands, hook scripts, helper scripts |
| `skills/` | Own skills (real directories) |
| `vendored-skills/` | Copies of third-party skills. `install.mjs` copies them into `skills/` |
| `mcp-servers.json` | User-scope MCP servers. `install.mjs` registers them |
| `install.mjs` | Restores what git cannot carry |

`.gitignore` is an allowlist. Credentials, transcripts, prompt history and caches are never tracked.

## Set up a new machine

Needs Git, Node and Claude Code. Run Claude Code once first, so `~/.claude` exists.

```sh
cd ~/.claude
git init -b main
git remote add origin https://github.com/LetsGaming/claude-config.git
git fetch origin
git checkout -f -B main origin/main
node install.mjs
```

Then:

1. Run `claude` and log in with `/login`.
2. Wait for the plugins to install on first launch.
3. Run `/mcp` and authenticate `graphify`.

## Notes

- Hook commands use `node "$HOME/.claude/hooks/..."`. Measured on Windows 11 (Git Bash): works. `node` must be on PATH.
- `chrome-devtools-edge` is Windows only (fixed Edge path).
- The plan hooks (`save-plan.mjs`, `restore-plan.mjs`) are not wired in `settings.json`. See `hooks/README.md`.
- Plugins are not copied. `enabledPlugins` and `extraKnownMarketplaces` make Claude Code fetch them.
- Not carried on purpose: `.credentials.json`, `.claude.json`, `projects/`, `history.jsonl`, `plugins/`, `skills/synced/`, `.remember/`, `plans/`.
