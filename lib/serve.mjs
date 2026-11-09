// `arch-diagrams serve`: the viewer on localhost. It draws the open diagram again when a .mmd
// file or the project file is saved, with the same zoom.

import http from 'node:http';
import { existsSync, watch } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { makeManifest } from './manifest.mjs';
import { viewerHtml } from './viewer.mjs';

/** The viewer is a page fragment (an artifact adds its own skeleton), so add one here. */
async function page() {
  const body = await viewerHtml();
  return '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body>' +
    body + '</body></html>';
}

export async function serve(args, root = process.cwd()) {
  const port = Number(args.port || 4800);
  const diagDir = path.resolve(root, args.dir);
  if (!existsSync(diagDir)) {
    console.error(`No diagram folder at ${args.dir}. Create it, or give the folder with --dir.`);
    process.exitCode = 1;
    return;
  }

  const clients = new Set();
  let timer = null;
  const changed = (what) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      for (const res of clients) res.write(`event: change\ndata: ${JSON.stringify(what)}\n\n`);
      console.log(`${new Date().toLocaleTimeString()}  changed: ${what}  (${clients.size} open)`);
    }, 60);
  };
  watch(diagDir, (_, file) => { if (file && file.endsWith('.mmd')) changed(file); });
  try {
    watch(path.resolve(root, args.project), () => changed(path.basename(args.project)));
  } catch {
    console.warn(`No project file at ${args.project}; the registry table stays empty.`);
  }
  // The theme file is optional, so watch its folder for it to appear, change or go.
  const themeAbs = path.resolve(root, args.theme);
  if (existsSync(path.dirname(themeAbs))) {
    watch(path.dirname(themeAbs), (_, file) => { if (file === path.basename(themeAbs)) changed(file); });
  }

  const send = (res, code, type, body) => {
    res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store' });
    res.end(body);
  };

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    try {
      if (url.pathname === '/' || url.pathname === '/index.html') return send(res, 200, 'text/html; charset=utf-8', await page());
      if (url.pathname === '/manifest.json') {
        const m = await makeManifest({ root, dir: args.dir, project: args.project, branch: args.branch, theme: args.theme, live: true });
        return send(res, 200, 'application/json', JSON.stringify(m));
      }
      if (url.pathname === '/events') {
        res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive' });
        res.write('retry: 1000\n\n');
        clients.add(res);
        const ping = setInterval(() => res.write(': ping\n\n'), 25000);
        req.on('close', () => { clearInterval(ping); clients.delete(res); });
        return;
      }
      const m = url.pathname.match(/^\/diagrams\/([^/]+\.mmd)$/);
      if (m) {
        const file = path.join(diagDir, path.basename(decodeURIComponent(m[1])));
        return send(res, 200, 'text/plain; charset=utf-8', await readFile(file, 'utf8'));
      }
      send(res, 404, 'text/plain', 'Not found');
    } catch (e) {
      send(res, e.code === 'ENOENT' ? 404 : 500, 'text/plain', String(e.message || e));
    }
  });

  server.listen(port, '127.0.0.1', () => {
    const link = `http://localhost:${port}/`;
    console.log(`Diagram viewer: ${link}\nWatching ${args.dir}, ${args.project} and ${args.theme}. Stop with Ctrl+C.`);
    if (args.open) {
      const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer' : 'xdg-open';
      execFile(cmd, [link], () => {});
    }
  });
}
