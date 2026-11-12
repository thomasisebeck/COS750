import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function runNode(args, cwd) {
  const result = spawnSync(process.execPath, args, { cwd, stdio: 'inherit', env: process.env });
  if (result.error) throw result.error;
  if (result.signal) {
    console.error(`Test process stopped by ${result.signal}.`);
    process.exit(1);
  }
  return result.status ?? 1;
}

function vitestPath(directory) {
  return join(directory, 'node_modules', 'vitest', 'vitest.mjs');
}

function runnerDirectory() {
  // On WSL's Windows mounts, loading the worker's many dependencies can stall
  // before its startup handshake. Keep the runner on Linux, but run the actual
  // source, tests and configuration in the original checkout via --root.
  const wsl = process.platform === 'linux' &&
    (/microsoft/i.test(readFileSync('/proc/sys/kernel/osrelease', 'utf8')));
  if (!wsl || !/^\/mnt\/[a-z]\//i.test(root)) return root;

  const lock = readFileSync(join(root, 'package-lock.json'));
  const manifest = readFileSync(join(root, 'package.json'));
  const fingerprint = createHash('sha256')
    .update(root).update(lock).update(manifest)
    .update(`${process.version}:${process.arch}`)
    .digest('hex').slice(0, 20);
  const cache = join(tmpdir(), 'cos750-vitest', fingerprint);
  const ready = join(cache, '.ready');
  if (!existsSync(ready) || !existsSync(vitestPath(cache))) {
    console.log('Preparing Linux-local test dependencies for WSL (cached for later runs)...');
    mkdirSync(cache, { recursive: true });
    copyFileSync(join(root, 'package.json'), join(cache, 'package.json'));
    copyFileSync(join(root, 'package-lock.json'), join(cache, 'package-lock.json'));
    const npm = process.env.npm_execpath;
    if (!npm) throw new Error('Run this script through npm test so the npm CLI can be located.');
    const status = runNode([npm, 'ci', '--include=dev', '--include=optional', '--prefer-offline', '--no-audit', '--no-fund'], cache);
    if (status !== 0) process.exit(status);
    writeFileSync(ready, fingerprint);
  }
  console.log('Using Linux-local test dependencies; testing source in:', root);
  return cache;
}

try {
  const runner = runnerDirectory();
  const args = process.argv.slice(2);
  const mode = args[0] === '--watch' ? args.shift() : 'run';
  process.exitCode = runNode([
    vitestPath(runner), mode, '--root', root,
    '--config', join(root, 'vitest.config.ts'), ...args,
  ], root);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
