// The diagram kit's parsing: headers, the project file's tables and their links.
//
//   npm test

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { cellToHtml, parseArgs, parseHeader, parseProject, parseTableUnder, repoWebUrl, slugFor, statusGroup } from '../lib/manifest.mjs';

const MMD = `---
title: Molecule systems · Integration map
config:
  theme: base
---
%% id: INT-01
%% type: integration-map
%% approved-by:
%% last-verified: 2026-11-06
flowchart LR
  a --> b
`;

const PROJECT = `# Architecture project file

## Integrations registry

Some words.

| ID | From → To | Status | Doc |
| --- | --- | --- | --- |
| I-01 | A → B | IN TEST | [order creation](../integrations/x/order-creation.md) |
| I-02 | B → C | RETIRING (replaced by I-01) | [status](#statuses) |
| I-03 | C → D | PLANNED | none \\| later |

## Diagram index
`;

describe('parseHeader', () => {
  test('reads the title and the %% lines, an empty value included', () => {
    assert.deepEqual(parseHeader(MMD), {
      title: 'Molecule systems · Integration map', id: 'INT-01', type: 'integration-map', approvedBy: '', lastVerified: '2026-11-06',
    });
  });
  test('the link slug is the lower-case id, else the file name', () => {
    assert.equal(slugFor({ id: 'INT-01' }, 'integration--molecule.mmd'), 'int-01');
    assert.equal(slugFor({}, 'integration--molecule.mmd'), 'integration--molecule');
  });
});

describe('parseTableUnder', () => {
  test('finds the first table under the heading, with escaped pipes kept in the cell', () => {
    const t = parseTableUnder(PROJECT, 'Integrations registry');
    assert.deepEqual(t.headers, ['ID', 'From → To', 'Status', 'Doc']);
    assert.equal(t.rows.length, 3);
    assert.equal(t.rows[2][3], 'none | later');
  });
  test('a heading with no table before the next heading gives nothing', () => {
    assert.equal(parseTableUnder('## A\ntext\n## B\n| x |\n| - |\n| 1 |\n', 'A'), null);
  });
});

describe('cellToHtml', () => {
  const opts = { projectPath: 'docs/architecture/PROJECT.md', repoBase: 'https://github.com/o/r/blob/main' };
  test('a relative link resolves from the project file to the repo', () => {
    assert.equal(cellToHtml('[doc](../integrations/x.md#flows)', opts),
      '<a href="https://github.com/o/r/blob/main/docs/integrations/x.md#flows" target="_blank" rel="noopener">doc</a>');
  });
  test('an anchor link points into the project file', () => {
    assert.match(cellToHtml('[s](#statuses)', opts), /href="https:\/\/github.com\/o\/r\/blob\/main\/docs\/architecture\/PROJECT.md#statuses"/);
  });
  test('without a repo, relative links stay as text', () => {
    assert.equal(cellToHtml('see [doc](x.md)', {}), 'see doc');
  });
  test('HTML in a cell is escaped; code and bold are kept', () => {
    assert.equal(cellToHtml('<script> `a<b` **c**', {}), '&lt;script&gt; <code>a&lt;b</code> <b>c</b>');
  });
});

describe('statusGroup', () => {
  test('groups the house statuses', () => {
    assert.equal(statusGroup('IN TEST'), 'built');
    assert.equal(statusGroup('IN BUILD'), 'built');
    assert.equal(statusGroup('LIVE'), 'built');
    assert.equal(statusGroup('OPEN'), 'future');
    assert.equal(statusGroup('PROPOSED'), 'future');
    assert.equal(statusGroup('RETIRING (replaced by I-01)'), 'retiring');
    assert.equal(statusGroup('?'), 'other');
  });
});

describe('parseProject', () => {
  test('gives the name, and each integration row with its id and status group', () => {
    const p = parseProject(PROJECT, {});
    assert.equal(p.name, 'Architecture project file');
    assert.equal(p.systems, null);
    assert.deepEqual(p.integrations.rows.map((r) => [r.id, r.group]), [['I-01', 'built'], ['I-02', 'retiring'], ['I-03', 'future']]);
    assert.equal(p.integrations.statusColumn, 2);
  });
});

describe('repoWebUrl and parseArgs', () => {
  test('turns SSH and HTTPS remotes into a web URL', () => {
    assert.equal(repoWebUrl('git@github.com:o/r.git\n'), 'https://github.com/o/r');
    assert.equal(repoWebUrl('https://github.com/o/r.git'), 'https://github.com/o/r');
    assert.equal(repoWebUrl(''), '');
  });
  test('removes a user name or token from an HTTPS remote', () => {
    assert.equal(repoWebUrl('https://x-access-token:secret@github.com/o/r.git'), 'https://github.com/o/r');
    assert.equal(repoWebUrl('https://token@github.com/o/r'), 'https://github.com/o/r');
  });
  test('reads values, flags and file names over the defaults', () => {
    assert.deepEqual(parseArgs(['--port', '5000', '--open', 'a.mmd', '--out=x'], { port: '4800' }),
      { port: '5000', open: true, _: ['a.mmd'], out: 'x' });
  });
});
