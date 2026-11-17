# claude-config

Personal Claude Code setup. This repo is `~/.claude`.

## What is in it

| Path | Holds |
|---|---|
| `CLAUDE.md` | Global instructions |
| `settings.json` | Hooks, env, model, plugin list, marketplaces, skill overrides |
| `agents/`, `commands/`, `hooks/`, `tools/`, `_templates/` | Subagents, slash commands, hook scripts, helper scripts |
| `skills/` | Own skills (real directories) |
| `skills.json` | Third-party skills as upstream repo plus names. `install.mjs` installs them from upstream |
| `mcp-servers.json` | User-scope MCP servers. `install.mjs` registers them |
| `install.mjs` | Restores what git cannot carry |
| `LICENSE` | Terms of use. Read before reusing anything here |

`.gitignore` is an allowlist. Credentials, transcripts, prompt history and caches are never tracked.

## Set up a new machine

Needs Git, Node and Claude Code. Run Claude Code once first, so `~/.claude` exists.

```sh
cd ~/.claude
git init -b main
git remote add origin https://github.com/<you>/<your-fork>.git
git fetch origin
git checkout -f -B main origin/main
node install.mjs
```

Then:

1. Run `claude` and log in with `/login`.
2. Wait for the plugins to install on first launch.

## Notes

- Hook commands use `node "$HOME/.claude/hooks/..."`. Measured on Windows 11 (Git Bash): works. `node` must be on PATH.
- `chrome-devtools-edge` is Windows only (fixed Edge path).
- The plan hooks (`save-plan.mjs`, `restore-plan.mjs`) are wired in `settings.json`. Whether `PostToolUse` fires for `ExitPlanMode` is not yet confirmed in a real session. See `hooks/README.md`.
- Plugins are not copied. `enabledPlugins` and `extraKnownMarketplaces` make Claude Code fetch them.
- Not carried on purpose: `.credentials.json`, `.claude.json`, `projects/`, `history.jsonl`, `plugins/`, `skills/synced/`, `.remember/`, `plans/`, and every `private/` folder (personal overlays).
- Some skills read an optional `private/` overlay (for example `skills/human-writing-style/private/`). Without it they use their general rules.

## Use it yourself

Fork the repo, then replace the remote in the setup commands with your fork. Edit `CLAUDE.md`, `settings.json` and `skills.json` to taste. Set `git config user.name` and `user.email` before you commit.

## License

Custom license based on MIT. You may use, copy and modify it, including to build commercial software. You may not sell it or offer it as part of a paid product or service, and works based on it must keep the same terms and the copyright notice, with source available. Output you produce with it is yours. `_templates/` and `skills/isolated-dev-sessions/templates/` are plain MIT, so you can copy them into projects. See `LICENSE`. Reuse of this repo or parts of it must credit `https://github.com/LetsGaming/claude-config`.

## Credits

This repo does not contain third-party skills. `skills.json` points at them, and each keeps its own license (all MIT when checked):

- [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill)
- [emilkowalski/skills](https://github.com/emilkowalski/skills)
- [vercel-labs/skills](https://github.com/vercel-labs/skills)
- [Leonxlnx/unlazy](https://github.com/Leonxlnx/unlazy)

Plugins come from the marketplaces named in `settings.json` and are fetched by Claude Code.
