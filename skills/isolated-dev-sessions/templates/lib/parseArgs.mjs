/** Minimal flag parser for dev-up.mjs / dev-down.mjs. Extend the `flags`/`bools` maps below if the
 *  project's scripts need more options: keep it this small, a real arg-parsing dependency is
 *  overkill for two scripts with three flags. */
export function parseArgs(argv) {
  const out = { id: "default", verbose: false, fresh: false, loggedout: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--id") out.id = argv[++i];
    else if (arg === "--verbose") out.verbose = true;
    else if (arg === "--fresh") out.fresh = true;
    else if (arg === "--loggedout") out.loggedout = true;
  }
  return out;
}
