# claude-config

Personal Claude Code setup. This repo is `~/.claude`.

## What is in it

| Path | Holds |
|---|---|
| `rules/base.md` | Shared global instructions. Your `CLAUDE.md` imports it |
| `settings.base.json` | Shared hooks, env, model, plugin list, marketplaces, skill overrides. `install.mjs` merges it into your `settings.json` |
| `agents/`, `commands/`, `hooks/`, `tools/`, `_templates/` | Subagents, slash commands, hook scripts, helper scripts |
| `skills/` | Own skills (real directories) |
| `skills.json` | Third-party skills as upstream repo plus names. `install.mjs` installs them from upstream |
| `mcp-servers.json` | User-scope MCP servers. `install.mjs` registers them |
| `install.mjs`, `lib/` | Applies the base files and restores what git cannot carry |
| `LICENSE` | Terms of use. Read before reusing anything here |

`.gitignore` is an allowlist. Credentials, transcripts, prompt history and caches are never tracked. Your own `settings.json` and `CLAUDE.md` are not tracked either, so a pull never touches them.

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

If you already have a `~/.claude/settings.json`, `install.mjs` does not touch it on the first run. It lists the keys the base would add. Check the list, then run `node install.mjs --adopt-base`. Your own values are kept either way.

Then:

1. Run `claude` and log in with `/login`.
2. Wait for the plugins to install on first launch.

Update later with:

```sh
cd ~/.claude
git pull
node install.mjs
```

## Notes

- Hook commands use `node "$HOME/.claude/hooks/..."`. Measured on Windows 11 (Git Bash): works. `node` must be on PATH.
- `chrome-devtools-edge` is Windows only (fixed Edge path).
- The plan hooks (`save-plan.mjs`, `restore-plan.mjs`) are wired in `settings.base.json`. Whether `PostToolUse` fires for `ExitPlanMode` is not yet confirmed in a real session. See `hooks/README.md`.
- Plugins are not copied. `enabledPlugins` and `extraKnownMarketplaces` in the base settings make Claude Code fetch them.
- Not carried on purpose: `.credentials.json`, `.claude.json`, `projects/`, `history.jsonl`, `plugins/`, `skills/synced/`, `.remember/`, `plans/`, and every `private/` folder (personal overlays).
- Some skills read an optional `private/` overlay (for example `skills/human-writing-style/private/`). Without it they use their general rules.

## Make it your own

You do not need a fork. Change your local files and pull as often as you like.

- **Settings:** edit `~/.claude/settings.json` freely, or let Claude Code change it. `install.mjs` merges `settings.base.json` into it and prints every key it changes, with these rules: a value you changed is kept, a value you never touched follows the repo, a key you removed stays removed, and new keys from the repo are added. Arrays (such as a hook list) count as one value: if you edit one, it stops following the repo.
- **Instructions:** put your own rules in `~/.claude/CLAUDE.md`. The first line, `@rules/base.md`, pulls in the shared rules. `install.mjs` adds that line if it is missing.
- **More skills:** list them in `skills.local.json`, in the same format as `skills.json`.
- **More MCP servers:** add them with `claude mcp add`. `install.mjs` never removes servers.
- **Keep your files out of tracked paths:** git only conflicts with files it tracks. Do not edit the files under `skills/`, `hooks/`, `agents/`, `commands/`, `tools/` or `lib/`. Copy them under a new name instead. New files in those folders do not conflict with a pull unless the repo adds one with the same name.

If you want to share your changes or keep them in your own repo, fork it, then run `git remote set-url origin https://github.com/<you>/<your-fork>.git`. Set `git config user.name` and `user.email` before you commit.

## License

Custom license based on MIT. You may use, copy and modify it, including to build commercial software. You may not sell it or offer it as part of a paid product or service, and works based on it must keep the same terms and the copyright notice, with source available. Output you produce with it is yours. `_templates/` and `skills/isolated-dev-sessions/templates/` are plain MIT, so you can copy them into projects. See `LICENSE`. Reuse of this repo or parts of it must credit `https://github.com/LetsGaming/claude-config`.

## Credits

This repo does not contain third-party skills. `skills.json` points at them, and each keeps its own license (all MIT when checked):

- [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill)
- [emilkowalski/skills](https://github.com/emilkowalski/skills)
- [vercel-labs/skills](https://github.com/vercel-labs/skills)
- [Leonxlnx/unlazy](https://github.com/Leonxlnx/unlazy)

Plugins come from the marketplaces named in `settings.json` and are fetched by Claude Code.
