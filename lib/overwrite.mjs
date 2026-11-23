import { existsSync, mkdirSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { confirm } from './bootstrap.mjs';

const resettable = ['settings.json', 'CLAUDE.md', '.install-state.json'];

// Moves the local config layer aside so the install rebuilds it from the shared base.
// Data (history, sessions, credentials) is never touched.
export const resetConfigLayer = async ({ root, dryRun = false, yes = false, log = console.log }) => {
  const present = resettable.filter((name) => existsSync(join(root, name)));
  if (present.length === 0) {
    log('  Nothing to reset.');
    return [];
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = join(root, 'backups', `overwrite-${stamp}`);
  log('  --overwrite will do this:');
  log(`    1. Move ${present.join(', ')} to ${backupDir}`);
  log('    2. Rebuild settings.json and CLAUDE.md from the shared base (settings.base.json, shared/base.md)');
  log('    3. Your own settings and instructions are NOT carried over. Copy them back from the backup by hand.');
  log('    Not touched: history, sessions, projects, credentials, plugins, ~/.claude.json.');
  if (dryRun) return present;
  if (!yes && !(await confirm('  Type y to move these files aside and rebuild them. [y/N] '))) {
    throw new Error('Stopped. Nothing was changed. Run again with --yes to confirm, or run it in a terminal.');
  }
  mkdirSync(backupDir, { recursive: true });
  for (const name of present) renameSync(join(root, name), join(backupDir, name));
  log(`  Moved. Backup: ${backupDir}`);
  return present;
};
