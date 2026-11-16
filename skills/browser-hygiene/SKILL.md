---
name: browser-hygiene
description: Use before any task that needs a real browser: manual verification of a running app, browser automation with Playwright or similar, screenshots, or checking rendered output. Covers which browser to use, opening it without disturbing the user's own session, tool calls that block the browser for long periods, and cleanup afterwards. Load it before the first browser call, because the costly mistakes (a blocked download dialog, a hijacked session) cannot be undone afterwards.
---

# Browser hygiene

## Choosing the browser

- Prefer Edge. Use Brave only if Edge fails (will not launch, extension or tool errors, connection failures) or the task needs another browser, for example cross-browser checks or a Brave-specific bug.

## Opening

- Open a new window, never a tab in an existing window, so the user's own tabs and session stay untouched.

## Never trigger a download or a modal

These block the tool, in one case for 30 minutes, and the session cannot recover on its own.

- Never click a download button in Edge through Playwright. Never open the downloads tab.
- To test export code, read the generated Blob in page script instead of downloading the file.
- Avoid actions that raise a native dialog (`alert`, `confirm`, `print`, file pickers, permission prompts). A modal blocks every further browser event.
- If a dialog does appear, dismiss it before anything else, and tell the user if the session cannot continue without them.

## Cleanup

- When browser work is done, close every window and tab you opened, and any browser process you launched. Never leave anything orphaned.
- Do not touch windows or tabs the user already had open.
