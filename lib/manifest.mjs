// The diagram kit's shared logic: read the diagram folder and the project file, and make the
// manifest that the viewer reads. serve.mjs makes it on each request, build.mjs writes it to a file.
// No dependencies, so the kit can be copied into any repo.

import { readdir, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

export const DEFAULTS = {
  dir: 'docs/architecture/diagrams',
  project: 'docs/architecture/PROJECT.md',
  branch: 'main',
};

/** The flags that never take a value. */
const FLAGS = new Set(['open', 'png']);

/** Reads `--name value`, `--name=value` and `--flag` arguments over the defaults. */
export function parseArgs(argv, defaults = {}) {
  const out = { ...defaults };
  for (let i = 0; i < argv.length; i++) {
    const m = argv[i].match(/^--([a-z-]+)(?:=(.*))?$/);
    if (!m) { (out._ ??= []).push(argv[i]); continue; }
    const key = m[1].replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    if (m[2] !== undefined) out[key] = m[2];
    else if (!FLAGS.has(key) && argv[i + 1] && !argv[i + 1].startsWith('--')) out[key] = argv[++i];
    else out[key] = true;
  }
  return out;
}

/** The `title:` of the front matter and the `%% key: value` lines of the house header. */
export function parseHeader(text) {
  const meta = {};
  const fm = text.match(/^---\n([\s\S]*?)\n---/);
  if (fm) {
    const t = fm[1].match(/^title:\s*(.+)$/m);
    if (t) meta.title = t[1].trim().replace(/^["']|["']$/g, '');
  }
  for (const m of text.matchAll(/^%%\s*([a-z-]+):[ \t]*(.*)$/gm)) {
    const key = m[1].replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    meta[key] = m[2].trim();
  }
  return meta;
}

/** The ID used in links (#int-01): the header's id, else the file name. */
export function slugFor(meta, file) {
  return (meta.id || path.basename(file, '.mmd')).toLowerCase().replace(/[^a-z0-9-]+/g, '-');
}

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * One Markdown table cell as safe HTML: links, `code` and **bold** only.
 * A relative link resolves against the folder of `projectPath`, then against `repoBase` when given;
 * without it the link text stays as plain text.
 */
export function cellToHtml(cell, { projectPath = '', repoBase = '' } = {}) {
  const projectDir = path.posix.dirname(projectPath);
  const links = [];
  let s = cell.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, href) => {
    links.push({ text, href });
    return `\u0000${links.length - 1}\u0000`;
  });
  s = escapeHtml(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => {
    const { text, href } = links[Number(i)];
    const label = escapeHtml(text).replace(/`([^`]+)`/g, '<code>$1</code>');
    let url = href;
    if (!/^[a-z]+:/i.test(href) && !href.startsWith('#')) {
      if (!repoBase) return label;
      url = `${repoBase}/${path.posix.normalize(path.posix.join(projectDir, href))}`;
    } else if (href.startsWith('#')) {
      if (!repoBase) return label;
      url = `${repoBase}/${projectPath}${href}`;
    }
    return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${label}</a>`;
  });
}

function splitRow(line) {
  const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/);
  return cells.map((c) => c.trim().replace(/\\\|/g, '|'));
}

/** The first Markdown table under a `## <heading>` of the project file, as headers and rows. */
export function parseTableUnder(markdown, heading) {
  const lines = markdown.split('\n');
  const start = lines.findIndex((l) => /^#{2,3}\s/.test(l) && l.replace(/^#+\s*/, '').trim().toLowerCase() === heading.toLowerCase());
  if (start < 0) return null;
  let i = start + 1;
  while (i < lines.length && !lines[i].startsWith('|')) {
    if (/^#{1,3}\s/.test(lines[i])) return null;
    i++;
  }
  if (i >= lines.length) return null;
  const headers = splitRow(lines[i]);
  const rows = [];
  for (i += 2; i < lines.length && lines[i].startsWith('|'); i++) rows.push(splitRow(lines[i]));
  return { headers, rows };
}

/** Which status group a status belongs to, for the viewer's filters and the line style. */
export function statusGroup(status) {
  const s = status.toUpperCase();
  if (/^RETIRING/.test(s)) return 'retiring';
  if (/^(PLANNED|PROPOSED|OPEN)/.test(s)) return 'future';
  if (/^(LIVE|IN TEST|IN BUILD)/.test(s)) return 'built';
  return 'other';
}

/** The project file's registries, ready for the viewer. */
export function parseProject(markdown, opts = {}) {
  const name = (markdown.match(/^#\s+(.+)$/m) || [])[1] || 'Architecture';
  const registry = (heading) => {
    const t = parseTableUnder(markdown, heading);
    if (!t) return null;
    const statusCol = t.headers.findIndex((h) => h.toLowerCase() === 'status');
    return {
      headers: t.headers,
      rows: t.rows.map((cells) => ({
        id: cells[0].replace(/[`*]/g, ''),
        group: statusCol >= 0 ? statusGroup(cells[statusCol] || '') : 'other',
        status: statusCol >= 0 ? cells[statusCol] : '',
        cells: cells.map((c) => cellToHtml(c, opts)),
      })),
      statusColumn: statusCol,
    };
  };
  return { name, integrations: registry('Integrations registry'), systems: registry('Systems registry') };
}

/**
 * `git@github.com:org/repo.git` or `https://github.com/org/repo.git` as a web URL.
 * It removes any user name or token from an HTTPS remote, because `build` publishes the URL.
 */
export function repoWebUrl(remote) {
  if (!remote) return '';
  const r = remote.trim().replace(/\.git$/, '');
  const ssh = r.match(/^git@([^:]+):(.+)$/);
  if (ssh) return `https://${ssh[1]}/${ssh[2]}`;
  if (!/^https?:\/\//.test(r)) return '';
  try {
    const u = new URL(r);
    return `${u.protocol}//${u.host}${u.pathname.replace(/\/$/, '')}`;
  } catch {
    return '';
  }
}

export function gitRemote(cwd) {
  try {
    return execFileSync('git', ['remote', 'get-url', 'origin'], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
}

/** Everything the viewer needs except the diagram sources themselves. */
export async function makeManifest({ root, dir, project, branch, repoUrl, live = false }) {
  const diagDir = path.resolve(root, dir);
  const files = (await readdir(diagDir)).filter((f) => f.endsWith('.mmd')).sort();
  const diagrams = [];
  for (const file of files) {
    const meta = parseHeader(await readFile(path.join(diagDir, file), 'utf8'));
    diagrams.push({ file, slug: slugFor(meta, file), ...meta });
  }
  const web = repoUrl ?? repoWebUrl(gitRemote(root));
  const repoBase = web ? `${web}/blob/${branch}` : '';
  let projectInfo = { name: 'Architecture', integrations: null, systems: null };
  try {
    const md = await readFile(path.resolve(root, project), 'utf8');
    projectInfo = parseProject(md, { projectPath: project.split(path.sep).join('/'), repoBase });
  } catch {
    // No project file: the viewer still shows the diagrams.
  }
  return {
    project: projectInfo.name,
    source: { dir, project, repo: web, branch },
    live,
    generated: new Date().toISOString(),
    diagrams,
    registries: { integrations: projectInfo.integrations, systems: projectInfo.systems },
  };
}
