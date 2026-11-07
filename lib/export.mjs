// `arch-diagrams export`: SVG (and PNG) exports in <folder>/_rendered/ with the Mermaid CLI.
// It fails when any diagram has an error, so it is also the render check for CI.
// The exports are build output: change the .mmd and export again, never edit an export.

import { existsSync, statSync } from 'node:fs';
import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

// The Mermaid CLI takes the latest Mermaid 11. The viewer pins its Mermaid in viewer/index.html.
const CLI = '@mermaid-js/mermaid-cli@11.4.2';

/** An installed Chrome, so Puppeteer does not need to download its own. */
function findChrome() {
  return [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  ].find((p) => p && existsSync(p));
}

/**
 * npx without a shell. On Windows npx is npx.cmd, which Node runs only through a shell,
 * so there each argument is quoted for cmd.exe.
 */
function runNpx(args) {
  if (process.platform !== 'win32') return spawnSync('npx', args, { encoding: 'utf8' });
  const quoted = args.map((a) => `"${String(a).replace(/"/g, '""')}"`);
  return spawnSync('npx.cmd', quoted, { encoding: 'utf8', shell: true });
}

export async function exportDiagrams(args, root = process.cwd()) {
  // Positional arguments are .mmd files or folders; with none, the diagram folder.
  const targets = args._?.length ? args._ : [args.dir];
  const files = [];
  for (const t of targets) {
    const abs = path.resolve(root, t);
    if (!existsSync(abs)) { console.error(`Not found: ${t}`); return 2; }
    if (statSync(abs).isDirectory()) {
      files.push(...(await readdir(abs)).filter((f) => f.endsWith('.mmd')).sort().map((f) => path.join(abs, f)));
    } else files.push(abs);
  }
  if (!files.length) { console.error(`No .mmd files in ${targets.join(', ')}`); return 1; }

  const tmp = await mkdtemp(path.join(os.tmpdir(), 'arch-diagrams-'));
  const pptr = path.join(tmp, 'puppeteer.json');
  const chrome = findChrome();
  await writeFile(pptr, JSON.stringify({
    headless: 'new',
    ...(chrome && { executablePath: chrome }),
    ...(process.env.CI && { args: ['--no-sandbox'] }),
  }));

  let failed = 0;
  for (const file of files) {
    const outDir = path.join(path.dirname(file), '_rendered');
    await mkdir(outDir, { recursive: true });
    const name = path.basename(file, '.mmd');
    for (const ext of args.png ? ['svg', 'png'] : ['svg']) {
      const target = path.join(outDir, `${name}.${ext}`);
      const r = runNpx(['-y', '-p', CLI, 'mmdc', '-q', '-p', pptr, '-i', file, '-o', target, '-b', 'white',
        ...(ext === 'png' ? ['-s', '2'] : [])]);
      if (r.status === 0) console.log(`ok     ${path.relative(root, target)}`);
      else {
        failed++;
        console.error(`ERROR  ${path.relative(root, file)}\n${(r.stderr || r.stdout || '').trim()}\n`);
        break;
      }
    }
  }
  await rm(tmp, { recursive: true, force: true });
  console.log(`${files.length} diagram(s) checked, ${failed} with errors.`);
  return failed ? 1 : 0;
}
