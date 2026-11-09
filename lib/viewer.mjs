// The viewer page, with the status code of status.mjs put in, so that the viewer and `export`
// read the status tags with the same code. `serve` and `build` both use it.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const viewerFile = path.join(here, '..', 'viewer', 'index.html');
const statusFile = path.join(here, 'status.mjs');

export async function viewerHtml() {
  const [html, lib] = await Promise.all([readFile(viewerFile, 'utf8'), readFile(statusFile, 'utf8')]);
  if (!html.includes('/* @status-lib */')) throw new Error('viewer/index.html has no /* @status-lib */ line');
  return html.replace('/* @status-lib */', () => lib.replace(/^export /gm, ''));
}
