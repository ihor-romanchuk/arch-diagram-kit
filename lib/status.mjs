// Statuses on diagram items: the one convention that every diagram type uses.
//
// The end of a label gives the status of its item, after " · ":
//
//   flowchart link     bc -.->|"I-01 · sends paid orders · IN TEST"| mw
//   sequence message   mw->>titan: I-05 · Release with the tote ID · PLANNED · TBC
//   state transition   af --> ca: Every line rejected · TBC
//   any box or note    m_split1["Split point 1 · TBC"]      Note over mw: Held for the gate · OPEN
//
// The viewer and `export` take the tag out of the label and show the status by colour, with a
// legend. A box can also take its status from the house classes `planned` and `tbc`.
//
// This file has no imports, because `serve` and `build` put it into the viewer page as it is,
// with the `export` keywords removed.

/** The status words, in the order of the legend. */
export const STATUSES = ['LIVE', 'IN TEST', 'IN BUILD', 'PLANNED', 'PROPOSED', 'OPEN', 'RETIRING'];

/** The group of each status, for the "Show" filter. "To confirm" (TBC) is a flag, not a group. */
export const STATUS_GROUPS = {
  LIVE: 'built', 'IN TEST': 'built', 'IN BUILD': 'built',
  PLANNED: 'future', PROPOSED: 'future', OPEN: 'future',
  RETIRING: 'retiring',
};

/** The filter groups, with the names that the viewer shows. */
export const GROUP_NAMES = { built: 'Built or in test', future: 'Not built yet', retiring: 'Retiring', tbc: 'To confirm' };

/** What each status means, for the legend and the tooltips. */
export const STATUS_MEANINGS = {
  LIVE: 'in production',
  'IN TEST': 'built, in test',
  'IN BUILD': 'being built',
  PLANNED: 'agreed, not built',
  PROPOSED: 'proposed, not agreed',
  OPEN: 'not decided, mechanism open',
  RETIRING: 'in use, to be removed',
};

/**
 * The house colour and line of each status. The project theme's `recolor` map applies to these
 * colours too, so a brand colour replaces a house colour everywhere.
 */
export const STATUS_STYLES = {
  LIVE: { color: '#3C8D6B', dash: '' },
  'IN TEST': { color: '#1F6FA8', dash: '' },
  'IN BUILD': { color: '#1F6FA8', dash: '10 4' },
  PLANNED: { color: '#C2410C', dash: '6 4' },
  PROPOSED: { color: '#C2410C', dash: '2 4' },
  OPEN: { color: '#B45309', dash: '6 4' },
  RETIRING: { color: '#7A8A97', dash: '2 3' },
};

/** "To confirm": the house `tbc` yellow. Yellow means this and nothing else. */
export const TBC_STYLE = { fill: '#FFF0A8', stroke: '#C07A1A', ink: '#5C4A00' };

/**
 * The colours of Mermaid's own notes (`Note over`, `note right of`). Mermaid makes them yellow,
 * which readers take for "to confirm", so the kit makes them neutral grey for every diagram.
 */
export const NOTE_THEME = { noteBkgColor: '#F3F6F8', noteBorderColor: '#9AA8B3', noteTextColor: '#1C2A35' };

/** A CSS-safe name for a status: "IN TEST" → "in-test". */
export const statusSlug = (s) => s.toLowerCase().replace(/\s+/g, '-');

// In the text given to Mermaid, the tag becomes an invisible marker: U+2063, one U+200B for each
// place in STATUSES, U+200C for "to confirm", U+2063. Mermaid keeps it in the drawing, and it takes
// no width, so the viewer and `export` find the item that each tag belongs to after Mermaid draws it.
const SEP = '⁣', ONE = '​', TBC = '‌';
export const MARKER_RE = /⁣(​*)(‌?)⁣/;
export const MARKER_RE_G = /⁣(​*)(‌?)⁣/g;

export function encodeMarker(status, tbc) {
  return SEP + ONE.repeat(status ? STATUSES.indexOf(status) + 1 : 0) + (tbc ? TBC : '') + SEP;
}

/** The status and the "to confirm" flag of a marker match. */
export function decodeMarker(m) {
  return { status: STATUSES[m[1].length - 1] || null, tbc: m[2].length > 0 };
}

const WORDS = STATUSES.join('|');
// " · STATUS[ qualifier][ · TBC]" or " · TBC", then the end of the label: a quote, a pipe, an
// arrow (for an unquoted flowchart label) or the end of the line. A link with no words can have a
// label of the tag alone: |"· TBC"|.
const TAG_RE = new RegExp(
  String.raw`(?:[ \t]+|(?<=["|]))\u00B7[ \t]+(?:(${WORDS})\b([^"|\u00B7\n]*?)(?:[ \t]+\u00B7[ \t]+(TBC))?|(TBC))` +
  String.raw`(?=[ \t]*(?:"|\||-->|---|-\.|\.-|==|~~~|$))`, 'gmu');

/**
 * The diagram text with each status tag replaced by its marker. A qualifier after the status word
 * ("PLANNED Q1", "RETIRING (replaced by I-01)") stays in the label. The front matter and the `%%`
 * lines do not change.
 */
export function markStatuses(text) {
  const fm = text.match(/^---\n[\s\S]*?\n---\n?/);
  const head = fm ? fm[0] : '';
  const body = text.slice(head.length).split('\n').map((line) => {
    if (/^\s*%%/.test(line)) return line;
    return line.replace(TAG_RE, (_, status, qual, tbc1, tbc2) => {
      const q = (qual || '').trim();
      return (q ? ' \u00B7 ' + q : '') + encodeMarker(status || null, Boolean(tbc1 || tbc2));
    });
  });
  return head + body.join('\n');
}

/** A status word from a header (`%% status-default: LIVE`), or null. */
export function parseStatusWord(s) {
  const w = String(s || '').trim().toUpperCase();
  return STATUSES.includes(w) ? w : null;
}

/** The group of a status, for the filter: built, future, retiring or other. */
export function statusGroup(status) {
  const s = String(status || '').trim().toUpperCase();
  const word = STATUSES.find((w) => s === w || s.startsWith(w + ' ') || s.startsWith(w + '('));
  return word ? STATUS_GROUPS[word] : 'other';
}

/** The status word at the start of a registry status ("RETIRING (replaced by I-01)" → RETIRING). */
export function statusWord(status) {
  const s = String(status || '').trim().toUpperCase();
  return STATUSES.find((w) => s === w || s.startsWith(w + ' ') || s.startsWith(w + '(')) || null;
}

/**
 * The CSS that colours the items by their `data-st` (status slug) and `data-tbc` attributes. The
 * viewer and `export` use the same rules. `scope` is the selector of the drawing; `recolor` maps a
 * house colour to the project's.
 */
export function statusCss(scope, recolor = (c) => c) {
  const S = (sel) => sel.split(',').map((x) => `${scope} ${x.trim()}`).join(',');
  const shapes = ':is(rect,polygon,path,circle,ellipse)';
  const rules = [];
  for (const s of STATUSES) {
    const { color, dash } = STATUS_STYLES[s];
    const c = recolor(color), slug = statusSlug(s);
    const d = `stroke-dasharray:${dash || 'none'}!important;`;
    rules.push(`${S(`path[data-st="${slug}"],line[data-st="${slug}"]`)}{stroke:${c}!important;stroke-width:2.5px!important;${d}}`);
    rules.push(`${S(`g.node[data-st="${slug}"] ${shapes},rect.note[data-st="${slug}"]`)}{stroke:${c}!important;stroke-width:2px!important;${d}}`);
  }
  const t = { fill: recolor(TBC_STYLE.fill), stroke: recolor(TBC_STYLE.stroke), ink: recolor(TBC_STYLE.ink) };
  rules.push(`${S('[data-st="retiring"] p,text[data-st="retiring"]')}{text-decoration:line-through;}`);
  rules.push(`${S(`g.node[data-tbc] ${shapes},rect.note[data-tbc]`)}{fill:${t.fill}!important;stroke:${t.stroke}!important;}`);
  rules.push(`${S('g.node[data-tbc] .nodeLabel,g.node[data-tbc] p')}{color:${t.ink}!important;}`);
  rules.push(`${S('g.label[data-tbc] p,g.label[data-tbc] .labelBkg,g.label[data-tbc] span.edgeLabel')}{background-color:${t.fill}!important;color:${t.ink}!important;}`);
  rules.push(`${S('g.label[data-tbc] p')}{box-shadow:0 0 0 1px ${t.stroke};border-radius:2px;}`);
  rules.push(`${S('text[data-tbc]')}{paint-order:stroke;stroke:${t.fill}!important;stroke-width:8px!important;stroke-linejoin:round;}`);
  return rules.join('\n');
}

/** The data attributes for a status and a "to confirm" flag. */
export function statusAttrs(status, tbc) {
  return (status ? ` data-st="${statusSlug(status)}"` : '') + (tbc ? ' data-tbc="1"' : '');
}

/**
 * For `export`: an SVG from the Mermaid CLI with the markers that `markStatuses` put in, as an SVG
 * with the markers taken out and the status attributes and CSS put in. `statusDefault` is the
 * status of a link, message or transition that has no tag.
 */
export function styleExportSvg(svg, { statusDefault = null, recolor } = {}) {
  const anchors = [];
  const add = (re, kind) => { for (const m of svg.matchAll(re)) anchors.push({ pos: m.index, kind, id: m[1], len: m[0].length }); };
  add(/<g class="label" data-id="([^"]+)"/g, 'elabel');
  add(/<g class="node[^"]*" id="([^"]+)"/g, 'node');
  add(/<text\b[^>]*class="messageText"[^>]*>/g, 'mtext');
  add(/<text\b[^>]*class="noteText"[^>]*>/g, 'ntext');
  anchors.sort((a, b) => a.pos - b.pos);
  const before = (pos) => { let a = null; for (const x of anchors) { if (x.pos < pos) a = x; else break; } return a; };
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const edits = new Map(); // tag start position -> attributes
  const mark = (pos, attrs) => { if (pos >= 0 && !edits.has(pos)) edits.set(pos, attrs); };
  const tagAt = (pos) => pos + svg.slice(pos).match(/^<[a-zA-Z]+/)[0].length;

  for (const m of svg.matchAll(MARKER_RE_G)) {
    const { status, tbc } = decodeMarker(m);
    const attrs = statusAttrs(status, tbc);
    const a = before(m.index);
    if (!a) continue;
    if (a.kind === 'elabel') {
      mark(a.pos, attrs);
      const p = svg.match(new RegExp(`<path\\b[^>]*data-id="${esc(a.id)}"`));
      if (p) mark(p.index, attrs);
    } else if (a.kind === 'node') {
      mark(a.pos, attrs);
    } else if (a.kind === 'mtext') {
      // A message on two or more lines is two or more texts before its line.
      let i = anchors.indexOf(a);
      mark(a.pos, attrs);
      while (i > 0 && anchors[i - 1].kind === 'mtext' && !/<(line|path)\b/.test(svg.slice(anchors[i - 1].pos + anchors[i - 1].len, anchors[i].pos))) {
        mark(anchors[--i].pos, attrs);
      }
      const rest = svg.slice(m.index).match(/<(?:line|path)\b[^>]*data-et="message"/);
      if (rest) mark(m.index + rest.index, attrs);
    } else if (a.kind === 'ntext') {
      const head = svg.slice(0, a.pos);
      const r = head.lastIndexOf('<rect');
      if (r >= 0 && /class="note"/.test(svg.slice(r, svg.indexOf('>', r)))) mark(r, attrs);
    }
  }
  let out = svg;
  for (const pos of [...edits.keys()].sort((x, y) => y - x)) {
    const at = tagAt(pos);
    out = out.slice(0, at) + edits.get(pos) + out.slice(at);
  }
  out = out.replace(MARKER_RE_G, '');
  if (statusDefault) {
    const attrs = statusAttrs(statusDefault, false);
    out = out.replace(/<(line|path)\b(?![^>]*data-st=)(?![^>]*note-edge)(?=[^>]*data-et="(?:message|edge)")/g, (t) => t + attrs);
  }
  const id = (out.match(/<svg\b[^>]*\bid="([^"]+)"/) || [])[1];
  const css = statusCss(id ? `#${id}` : 'svg', recolor);
  return out.replace(/<\/svg>\s*$/, `<style>${css}</style></svg>`);
}
