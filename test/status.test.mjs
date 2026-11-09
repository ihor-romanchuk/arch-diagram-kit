// The status convention: the tags at the end of a label, their markers, and the export's colours.
//
//   npm test

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  decodeMarker, encodeMarker, markStatuses, MARKER_RE, MARKER_RE_G, parseStatusWord, statusCss,
  statusGroup, statusWord, styleExportSvg,
} from '../lib/status.mjs';
import { parseProject } from '../lib/manifest.mjs';

/** The label text with each marker shown as [STATUS] or [STATUS+TBC]. */
const show = (text) => text.replace(MARKER_RE_G, (...m) => {
  const { status, tbc } = decodeMarker(m);
  return '[' + [status, tbc && 'TBC'].filter(Boolean).join('+') + ']';
});

describe('markStatuses', () => {
  test('reads a tag at the end of a flowchart link, quoted or between pipes', () => {
    assert.equal(show(markStatuses('  bc -.->|"I-01 · sends paid orders<br/>webhook · DONE"| mw')),
      '  bc -.->|"I-01 · sends paid orders<br/>webhook[DONE]"| mw');
    assert.equal(show(markStatuses('  a -->|I-02 · creates · PLANNED| b')), '  a -->|I-02 · creates[PLANNED]| b');
    assert.equal(show(markStatuses('  a -- "Kill · TBC" --> b')), '  a -- "Kill[TBC]" --> b');
    assert.equal(show(markStatuses('  a -- Kill · OPEN --> b')), '  a -- Kill[OPEN] --> b');
  });
  test('reads a status with "to confirm", and keeps a qualifier in the label', () => {
    assert.equal(show(markStatuses('  a->>b: I-05 · Release · PLANNED · TBC')), '  a->>b: I-05 · Release[PLANNED+TBC]');
    assert.equal(show(markStatuses('  a -->|"I-16 · webhook · RETIRING (replaced by I-01)"| b')),
      '  a -->|"I-16 · webhook · (replaced by I-01)[RETIRING]"| b');
    assert.equal(show(markStatuses('  a -->|"I-16 · webhook · RETIRED"| b')), '  a -->|"I-16 · webhook[RETIRED]"| b');
    assert.equal(show(markStatuses('  a -->|"I-08 · REST · PLANNED Q1"| b')), '  a -->|"I-08 · REST · Q1[PLANNED]"| b');
  });
  test('reads messages, transitions, notes and boxes', () => {
    assert.equal(show(markStatuses('  af --> ca: Every line rejected · TBC')), '  af --> ca: Every line rejected[TBC]');
    assert.equal(show(markStatuses('  Note over mw: Held for the gate · OPEN')), '  Note over mw: Held for the gate[OPEN]');
    assert.equal(show(markStatuses('  m_split1["Split point 1 · TBC"]')), '  m_split1["Split point 1[TBC]"]');
  });
  test('reads the older words as the three statuses', () => {
    assert.equal(show(markStatuses('  a->>b: x · IN TEST\n  a->>b: y · LIVE\n  a->>b: z · IN BUILD\n  a->>b: w · PROPOSED')),
      '  a->>b: x[DONE]\n  a->>b: y[DONE]\n  a->>b: z[PLANNED]\n  a->>b: w[OPEN]');
  });
  test('a link with no words takes a label of the tag alone', () => {
    assert.equal(show(markStatuses('  w_kill -->|"· TBC"| m_refund')), '  w_kill -->|"[TBC]"| m_refund');
  });
  test('leaves words that are not a tag: lower case, inside a label, the front matter and %% lines', () => {
    const text = [
      '---', 'title: Order · OPEN', '---',
      '%% note G1 a: The order · OPEN',
      '  cs_app["Customer service app<br/>Agency 51 · planned"]',
      '  a->>b: OPEN the order · then ship',
      '  a->>b: Picked [webhook]',
    ].join('\n');
    assert.equal(markStatuses(text), text);
  });
});

describe('markers', () => {
  test('a marker holds the status and the "to confirm" flag, and takes no visible room', () => {
    for (const [status, tbc] of [['DONE', false], ['RETIRING', true], [null, true]]) {
      const m = encodeMarker(status, tbc).match(MARKER_RE);
      assert.deepEqual(decodeMarker(m), { status, tbc });
    }
    assert.match(encodeMarker('OPEN', true), /^[⁣​‌]+$/);
  });
  test('the status words and their groups: retiring is planned work, retired is done', () => {
    assert.equal(statusGroup('DONE'), 'done');
    assert.equal(statusGroup('IN BUILD'), 'planned');
    assert.equal(statusGroup('PLANNED Q1'), 'planned');
    assert.equal(statusGroup('PROPOSED'), 'open');
    assert.equal(statusGroup('RETIRING (replaced by I-01)'), 'planned');
    assert.equal(statusGroup('RETIRED'), 'done');
    assert.equal(statusGroup('Approved'), 'other');
    assert.equal(statusWord('RETIRING (replaced by I-01)'), 'RETIRING');
    assert.equal(parseStatusWord(' in test '), 'DONE');
    assert.equal(parseStatusWord('built'), null);
  });
});

describe('styleExportSvg', () => {
  const m = (s, t) => encodeMarker(s, t);
  test('colours a link and its label by the marker in the label', () => {
    const svg = `<svg id="my-svg" viewBox="0 0 10 10"><g class="edgePaths"><path d="M0" id="my-svg-L_a_b_0" data-et="edge" data-id="L_a_b_0"/></g>` +
      `<g class="edgeLabels"><g class="edgeLabel"><g class="label" data-id="L_a_b_0"><foreignObject><div><p>I-01 · x${m('PLANNED', true)}</p></div></foreignObject></g></g></g></svg>`;
    const out = styleExportSvg(svg);
    assert.match(out, /<path data-st="planned" data-tbc="1" d="M0"/);
    assert.match(out, /<g data-st="planned" data-tbc="1" class="label" data-id="L_a_b_0"/);
    assert.doesNotMatch(out, /⁣/);
    assert.match(out, /<style>#my-svg path\[data-st="done"\]/);
  });
  test('colours a message on two lines, and gives untagged messages the default', () => {
    const svg = `<svg id="s"><text class="messageText">I-05 · one</text><text class="messageText">two${m('OPEN', false)}</text>` +
      `<line class="messageLine0" data-et="message" data-id="i1"/><text class="messageText">reply</text>` +
      `<line class="messageLine1" data-et="message" data-id="i2"/></svg>`;
    const out = styleExportSvg(svg, { statusDefault: 'DONE' });
    assert.equal((out.match(/<text data-st="open"/g) || []).length, 2);
    assert.match(out, /<line data-st="open" class="messageLine0"/);
    assert.match(out, /<line data-st="done" class="messageLine1"/);
  });
  test('colours a box and a sequence note', () => {
    const svg = `<svg id="s"><g class="node default" id="s-flowchart-a-0"><rect/><p>Box${m(null, true)}</p></g>` +
      `<g data-et="note"><rect x="0" class="note"/><text class="noteText">Held${m('OPEN', false)}</text></g></svg>`;
    const out = styleExportSvg(svg);
    assert.match(out, /<g data-tbc="1" class="node default"/);
    assert.match(out, /<rect data-st="open" x="0" class="note"/);
  });
  test('the CSS takes the theme colours', () => {
    assert.match(statusCss('#x', (c) => (c === '#1F6FA8' ? '#186267' : c)), /data-st="done"\]\{stroke:#186267/);
    assert.match(statusCss('#x'), /\[data-st="retiring"\] p[^{]*\{text-decoration:line-through/);
  });
});

describe('note codes in the project file', () => {
  test('the first paragraph under "Note codes" is the key for the circled codes', () => {
    const md = '# P\n\n## Note codes\n\nCodes from the [maps](https://example.com/maps).\nOr our own.\n\nNot this.\n';
    assert.equal(parseProject(md).noteCodes,
      'Codes from the <a href="https://example.com/maps" target="_blank" rel="noopener">maps</a>. Or our own.');
    assert.equal(parseProject('# P\n').noteCodes, null);
  });
});
