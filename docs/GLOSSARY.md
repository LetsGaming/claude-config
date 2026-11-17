# Glossary

**Base file.** A tracked, shared file that `install.mjs` applies to a local, untracked file: `settings.base.json` into `settings.json`, and `rules/base.md` into `CLAUDE.md` through an import line. The local file is yours. The base file is the repo's.

**Private overlay.** A gitignored `private/` folder next to a skill. It holds personal material (voice profiles, project-specific rules) that stays on your machine. The skill text says to read it if it exists.

**Skill manifest.** `skills.json`. Lists third-party skills as upstream repo plus skill names. `install.mjs` installs them from upstream with `npx skills add`.

**Vendored skill.** A third-party skill copied into this repo. This repo no longer carries any. Use the skill manifest instead.
