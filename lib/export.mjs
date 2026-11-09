// `arch-diagrams export`: SVG (and PNG) exports in <folder>/_rendered/ with the Mermaid CLI.
// It fails when any diagram has an error, so it is also the render check for CI.
// The exports are build output: change the .mmd and export again, never edit an export.

import { existsSync, statSync, writeFileSync } from 'node:fs';
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { loadTheme, parseHeader, recolor } from './manifest.mjs';
import { markStatuses, NOTE_THEME, parseStatusWord, styleExportSvg } from './status.mjs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

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

/** A PNG at twice the size of the SVG, taken by headless Chrome. */
function pngFromSvg(chrome, svg, png, tmp) {
  const vb = (svg.match(/viewBox="([^"]+)"/) || [])[1];
  const [, , w, h] = vb ? vb.split(/[\s,]+/).map(Number) : [0, 0, 1200, 800];
  const page = path.join(tmp, 'png.html');
  const width = Math.ceil(w), height = Math.ceil(h);
  writeFileSync(page, `<!doctype html><style>html,body{margin:0;background:#fff}svg{display:block;width:${width}px;height:${height}px}</style>` +
    svg.replace(/<svg\b/, `<svg width="${width}" height="${height}"`).replace(/ style="max-width:[^"]*"/, ''));
  const r = spawnSync(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=2',
    `--window-size=${width},${height}`, `--screenshot=${png}`, pathToFileURL(page).href,
    ...(process.env.CI ? ['--no-sandbox'] : [])], { encoding: 'utf8' });
  return r.status === 0 && existsSync(png);
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

  let theme;
  try { theme = await loadTheme(root, args.theme); } catch (e) { console.error(e.message); return 2; }
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'arch-diagrams-'));
  const pptr = path.join(tmp, 'puppeteer.json');
  const chrome = findChrome();
  await writeFile(pptr, JSON.stringify({
    headless: 'new',
    ...(chrome && { executablePath: chrome }),
    ...(process.env.CI && { args: ['--no-sandbox'] }),
  }));

  // Mermaid's notes in neutral grey, as in the viewer: yellow means "to confirm" only.
  const tint = (c) => recolor(c, theme?.recolor);
  const config = path.join(tmp, 'config.json');
  await writeFile(config, JSON.stringify({
    themeVariables: Object.fromEntries(Object.entries(NOTE_THEME).map(([k, v]) => [k, tint(v)])),
  }));

  let failed = 0;
  for (const file of files) {
    const outDir = path.join(path.dirname(file), '_rendered');
    await mkdir(outDir, { recursive: true });
    const name = path.basename(file, '.mmd');
    // Export a copy: in the project's colours when there is a theme, and with each status tag as a
    // marker that styleExportSvg turns into a colour. The .mmd itself does not change.
    const source = await readFile(file, 'utf8');
    const input = path.join(tmp, `${name}.mmd`);
    await writeFile(input, markStatuses(recolor(source, theme?.recolor)));
    const svgFile = path.join(outDir, `${name}.svg`);
    const r = runNpx(['-y', '-p', CLI, 'mmdc', '-q', '-p', pptr, '-c', config, '-i', input, '-o', svgFile, '-b', 'white']);
    if (r.status !== 0) {
      failed++;
      console.error(`ERROR  ${path.relative(root, file)}\n${(r.stderr || r.stdout || '').trim()}\n`);
      break;
    }
    const statusDefault = parseStatusWord(parseHeader(source).statusDefault);
    const svg = styleExportSvg(await readFile(svgFile, 'utf8'), { statusDefault, recolor: tint });
    await writeFile(svgFile, svg);
    console.log(`ok     ${path.relative(root, svgFile)}`);
    if (args.png) {
      const png = path.join(outDir, `${name}.png`);
      const ok = chrome && pngFromSvg(chrome, svg, png, tmp);
      if (ok) console.log(`ok     ${path.relative(root, png)}`);
      else {
        failed++;
        console.error(`ERROR  ${path.relative(root, png)}: a PNG needs Chrome; set PUPPETEER_EXECUTABLE_PATH\n`);
        break;
      }
    }
  }
  await rm(tmp, { recursive: true, force: true });
  console.log(`${files.length} diagram(s) checked, ${failed} with errors.`);
  return failed ? 1 : 0;
}
