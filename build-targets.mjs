import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const root = resolve('.');

const targets = {
  chrome: { manifest: 'src/manifest.json', output: 'dist-chrome' },
  firefox: { manifest: 'targets/firefox/manifest.json', output: 'dist-firefox' },
  safari: { manifest: 'targets/safari/manifest.json', output: 'dist-safari' }
};

const target = process.argv[2];
if (!targets[target]) {
  throw new Error(`Usage: node build-targets.mjs ${Object.keys(targets).join('|')}`);
}

await exec('npm', ['run', 'build'], { cwd: root });
const { manifest, output } = targets[target];
const destination = resolve(output);
await rm(destination, { recursive: true, force: true });
await cp(resolve('dist'), destination, { recursive: true });
await cp(resolve(manifest), resolve(destination, 'manifest.json'));
console.log(`Built ${target} extension in ${output}/`);

