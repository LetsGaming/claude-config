const sameRepo = (a, b) => typeof a === 'string' && typeof b === 'string' && a.toLowerCase() === b.toLowerCase();

// Decides what to add. Nothing is ever removed or re-enabled.
// manifest: [{ marketplace, repo, plugins }]. marketplaces: `claude plugin marketplace list --json`.
// installed: `claude plugin list --json`.
// A marketplace counts as present when its repo is registered, under any name.
// A plugin counts as present when it is installed at user scope, enabled or not.
export function planPlugins(manifest, marketplaces, installed) {
  const groups = new Map();
  for (const { marketplace, repo, plugins } of manifest) {
    const key = repo.toLowerCase();
    const group = groups.get(key) ?? { marketplace, repo, plugins: new Set() };
    for (const name of plugins) group.plugins.add(name);
    groups.set(key, group);
  }

  const userScope = new Set(installed.filter((entry) => entry.scope === 'user').map((entry) => entry.id));

  return [...groups.values()].map(({ marketplace, repo, plugins }) => {
    const registered = marketplaces.find((entry) => sameRepo(entry.repo, repo));
    const taken = marketplaces.find((entry) => entry.name === marketplace);
    if (!registered && taken) {
      return { marketplace, repo, action: 'conflict', conflictRepo: taken.repo, plugins: [] };
    }
    const name = registered?.name ?? marketplace;
    return {
      marketplace: name,
      repo,
      action: registered ? 'keep' : 'add',
      plugins: [...plugins].map((plugin) => {
        const id = `${plugin}@${name}`;
        return { id, action: userScope.has(id) ? 'keep' : 'add' };
      }),
    };
  });
}
