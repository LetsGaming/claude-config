# <Project name>

One or two sentences: what this project is, and who uses it.

## Stack

- Runtime and versions:
- Package manager: (follow the lockfile; `pnpm-lock.yaml` means pnpm, `package-lock.json` means npm, `yarn.lock` means yarn)
- Database:
- Deploy target:

## Conventions specific to this project

Only rules that differ from the global defaults, or that the global file deliberately leaves to the project. Delete the headings that do not apply.

### Platform support

- Code, tooling, and committed scripts must run on both Linux and Windows.
- Build paths with `path.join` or `path.resolve`. No hardcoded separators.
- (Delete this section if the project targets one OS.)

### Glossary

- Keep uncommon terms, and terms whose meaning shifts by context, in `docs/GLOSSARY.md`.
- Do not invent project-specific terms. If a name needs a glossary entry to be understood, pick a plainer name.

### Dev environment

- `dev-up` / `dev-down`: (document them here if the project has its own, which turns off the `isolated-dev-sessions` skill)
- Ports:
- Seed data:

### Changelog

- (If this repository has `changelog.d/`, say so here. The `changelog-fragments` skill carries the workflow.)

### Testing

- Command to run the suite:
- What is expected to be red:
- Anything slow or needing credentials:

## Known traps

Things that have cost time before. One line each, with the symptom first so it is searchable.

- <symptom>: <cause and fix>

## Out of scope

What not to touch, and what not to propose.
