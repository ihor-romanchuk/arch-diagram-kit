// The diagram kit's parsing: headers, the project file's tables and their links.
//
//   npm test

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { sortDiagrams, cellToHtml, loadTheme, parseArgs, parseHeader, parseProject, parseTableUnder, recolor, repoWebUrl, slugFor, statusGroup } from '../lib/manifest.mjs';

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

describe('notes in the header', () => {
  const text = [
    '%% id: PRC-01',
    '%% notes: The question, not a note.',
    '%% note G1 m_rule,p_check: The gate holds the order.',
    '%%    It waits for every line.',
    '%% note T1 s_rej [to confirm]: How a rejection reaches us.',
    '%% note X9: A note with no box.',
    '%% owner: Ihor',
    'flowchart LR',
  ].join('\n');
  const meta = parseHeader(text);
  test('reads each note with its targets, its "to confirm" mark and its continued text', () => {
    assert.deepEqual(meta.callouts, [
      { code: 'G1', targets: ['m_rule', 'p_check'], toConfirm: false, text: 'The gate holds the order. It waits for every line.' },
      { code: 'T1', targets: ['s_rej'], toConfirm: true, text: 'How a rejection reaches us.' },
      { code: 'X9', targets: [], toConfirm: false, text: 'A note with no box.' },
    ]);
  });
  test('keeps the header keys, the question in "notes" included', () => {
    assert.equal(meta.notes, 'The question, not a note.');
    assert.equal(meta.owner, 'Ihor');
  });
  test('a file without notes has no callouts', () => {
    assert.equal(parseHeader(MMD).callouts, undefined);
  });
});

describe('themes', () => {
  test('recolor replaces each mapped colour, in any case, and leaves the others', () => {
    const out = recolor('classDef internal fill:#1f6fa8,stroke:#15527D,color:#ffffff', { '#1F6FA8': '#186267', '#15527d': '#103341' });
    assert.equal(out, 'classDef internal fill:#186267,stroke:#103341,color:#ffffff');
  });
  test('loadTheme gives null with no file, and refuses a font host other than Google Fonts', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'kit-theme-'));
    assert.equal(await loadTheme(dir, 'theme.json'), null);
    await writeFile(path.join(dir, 'bad.json'), JSON.stringify({ fonts: { stylesheet: 'https://evil.example/f.css' } }));
    await assert.rejects(loadTheme(dir, 'bad.json'), /fonts\.googleapis\.com/);
    await writeFile(path.join(dir, 'ok.json'), JSON.stringify({ recolor: { '#1F6FA8': '#186267' } }));
    assert.deepEqual((await loadTheme(dir, 'ok.json')).recolor, { '#1F6FA8': '#186267' });
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
  test('groups the house statuses, older words included', () => {
    assert.equal(statusGroup('DONE'), 'done');
    assert.equal(statusGroup('IN TEST'), 'done');
    assert.equal(statusGroup('LIVE'), 'done');
    assert.equal(statusGroup('IN BUILD'), 'planned');
    assert.equal(statusGroup('OPEN'), 'open');
    assert.equal(statusGroup('PROPOSED'), 'open');
    assert.equal(statusGroup('RETIRING (replaced by I-01)'), 'planned');
    assert.equal(statusGroup('?'), 'other');
  });
});

describe('parseProject', () => {
  test('gives the name, and each integration row with its id and status group', () => {
    const p = parseProject(PROJECT, {});
    assert.equal(p.name, 'Architecture project file');
    assert.equal(p.systems, null);
    assert.deepEqual(p.integrations.rows.map((r) => [r.id, r.group]), [['I-01', 'done'], ['I-02', 'planned'], ['I-03', 'planned']]);
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

describe('sortDiagrams', () => {
  const ds = [
    { file: 'sequence--b.mmd', id: 'SEQ-10' }, { file: 'sequence--a.mmd', id: 'SEQ-2' },
    { file: 'state--x.mmd', id: 'STA-01' }, { file: 'integration--x.mmd', id: 'INT-01' }, { file: 'loose.mmd' },
  ];
  test('sorts by the catalog type order, then by number, not by file name', () => {
    assert.deepEqual(sortDiagrams(ds).map((d) => d.id || d.file), ['INT-01', 'SEQ-2', 'SEQ-10', 'STA-01', 'loose.mmd']);
  });
  test('the Diagram index order comes first', () => {
    assert.deepEqual(sortDiagrams(ds, ['STA-01', 'SEQ-10']).map((d) => d.id || d.file), ['STA-01', 'SEQ-10', 'INT-01', 'SEQ-2', 'loose.mmd']);
  });
});
