const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const canonical = (value) =>
  JSON.stringify(value, (_key, v) =>
    isObject(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b))) : v,
  );

// Three-way merge of the shared base into the user's file.
// base: shared file now. previous: shared file at the last install. current: the user's file.
// A value the user changed is kept. A value equal to the previous base follows the new base.
// A key the user removed stays removed. Arrays are compared as a whole.
export function mergeSettings(base, previous, current) {
  const nested = (isObject(base) || isObject(previous)) && (current === undefined || isObject(current));
  if (nested) {
    const out = isObject(current) ? { ...current } : {};
    const keys = new Set([
      ...Object.keys(isObject(base) ? base : {}),
      ...Object.keys(isObject(previous) ? previous : {}),
    ]);
    for (const key of keys) {
      const merged = mergeSettings(
        isObject(base) ? base[key] : undefined,
        isObject(previous) ? previous[key] : undefined,
        isObject(current) ? current[key] : undefined,
      );
      if (merged === undefined) delete out[key];
      else out[key] = merged;
    }
    if (current === undefined && previous !== undefined && Object.keys(out).length === 0) return undefined;
    return out;
  }
  if (current === undefined) return previous === undefined ? base : undefined;
  if (canonical(current) === canonical(previous)) return base;
  return current;
}
