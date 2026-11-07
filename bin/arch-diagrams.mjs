#!/usr/bin/env node
// The diagram kit's one command. Run it from the root of the project that has the diagrams.
//
//   npx -y github:ihor-romanchuk/arch-diagram-kit#<version> <command> [options]

import { DEFAULTS, parseArgs } from '../lib/manifest.mjs';

const HELP = `arch-diagrams <command> [options]

Commands:
  serve    Open the viewer on localhost. It draws a diagram again when its file is saved.
           --port 4800   --open
  export   Write SVG exports to <folder>/_rendered/. Fails when a diagram has an error.
           [file.mmd | folder ...]   --png
  build    Write the viewer and the diagrams into one folder, for publishing.
           --out .diagrams-site

Options for every command:
  --dir      The diagram folder       (default ${DEFAULTS.dir})
  --project  The project file         (default ${DEFAULTS.project})
  --branch   Branch for doc links     (default ${DEFAULTS.branch})
  --theme    The theme file, optional (default ${DEFAULTS.theme})
`;

const [command, ...rest] = process.argv.slice(2);
const args = parseArgs(rest, DEFAULTS);

switch (command) {
  case 'serve': {
    const { serve } = await import('../lib/serve.mjs');
    await serve(args);
    break;
  }
  case 'export': {
    const { exportDiagrams } = await import('../lib/export.mjs');
    process.exitCode = await exportDiagrams(args);
    break;
  }
  case 'build': {
    const { build } = await import('../lib/build.mjs');
    await build(args);
    break;
  }
  case undefined: case 'help': case '--help': case '-h':
    console.log(HELP);
    break;
  default:
    console.error(`Unknown command: ${command}\n\n${HELP}`);
    process.exitCode = 2;
}
