// `arch-diagrams build`: the viewer and every diagram in one folder that works with no server.
// That folder is the copy that gets published for people to use as a reference.

import { copyFile, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeManifest } from './manifest.mjs';

const viewerFile = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'viewer', 'index.html');

export async function build(args, root = process.cwd()) {
  const outRel = args.out || '.diagrams-site';
  const out = path.resolve(root, outRel);
  const diagDir = path.resolve(root, args.dir);

  await rm(out, { recursive: true, force: true });
  await mkdir(path.join(out, 'diagrams'), { recursive: true });

  const manifest = await makeManifest({ root, dir: args.dir, project: args.project, branch: args.branch, live: false });
  // The published page is named after the project, so it can be told apart from other projects' viewers.
  const viewer = await readFile(viewerFile, 'utf8');
  const title = manifest.project.replace(/[<&]/g, '');
  await writeFile(path.join(out, 'index.html'), viewer.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`));
  await writeFile(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2));

  const files = { 'manifest.json': path.join(outRel, 'manifest.json') };
  for (const f of (await readdir(diagDir)).filter((n) => n.endsWith('.mmd'))) {
    await copyFile(path.join(diagDir, f), path.join(out, 'diagrams', f));
    files[`diagrams/${f}`] = { from: path.join(outRel, 'diagrams', f), contentType: 'text/plain' };
  }

  console.log(JSON.stringify({
    page: path.join(outRel, 'index.html'),
    files,
    diagrams: manifest.diagrams.map((d) => d.id || d.file),
  }, null, 2));
}
