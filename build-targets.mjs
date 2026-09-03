import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
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
if (target === 'safari') {
  await writeFile(resolve(destination, 'SAFARI-XCODE.md'), `# Safari packaging

This directory is the web-extension payload for Safari 17+ on macOS 14+.

1. In Xcode, create a Safari Web Extension App target.
2. Set the extension's resource folder to this directory.
3. Build and run the containing app for local testing.
4. Archive, configure the Apple Developer signing identity, and submit the app through App Store Connect.

Safari does not install this raw folder as a distributable extension.
`);
}
console.log(`Built ${target} extension in ${output}/`);

