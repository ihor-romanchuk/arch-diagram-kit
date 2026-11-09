# arch-diagram-kit

My portable system for architecture diagrams. It goes with me from project to project, whatever the client uses: Jira or Linear, Confluence or Notion, GitHub or Azure DevOps, a personal or an enterprise Claude account.

- **One format:** every diagram is Mermaid text (`.mmd`). Images and pages are exports.
- **One catalog:** eight diagram types, each with a clear purpose and audience.
- **One house style:** the same header, names, colours and labels on every project.
- **One skill:** Claude follows the same rules every time, in every account.
- **One file per project:** `PROJECT.md` holds that project's systems, integrations and approvers.

## What's in the repo

```
arch-diagram-kit/
├── README.md                 this file
├── catalog.md                the 8 diagram types: when to use each, what it must show
├── house-style.md            header, statuses, names, colour key, labels, review checklist
├── skills/
│   └── architecture-diagrams/
│       └── SKILL.md          the skill for Claude and other agents (npx skills layout)
├── project-template/
│   └── PROJECT.md            copy into each new project and fill in
├── package.json              the arch-diagrams command (no dependencies)
├── bin/arch-diagrams.mjs     serve, export, build
├── lib/                      the commands and the parsing of headers and PROJECT.md
├── viewer/index.html         the viewer page: pan, zoom, full screen, statuses, notes, linked registry
├── test/                     tests for the parsing (npm test)
├── examples/brewbox/         a complete worked example (fictional shop on AWS + Node.js)
│   ├── PROJECT.md
│   ├── diagrams/*.mmd        one example of each type: use them as templates
│   ├── diagrams/_rendered/   SVG exports
│   └── catalog.html          all 8 examples on one page
└── scripts/
    └── render.sh             the same as `arch-diagrams export`, kept for older instructions
```

## Install the skill

The skill lives at `skills/architecture-diagrams/SKILL.md`. This repo is the only copy you edit; every install is pulled from it.

### Coding agents on a laptop (Claude Code, Cursor, Codex, Copilot and others)

Use the [skills CLI](https://skills.sh) (needs Node.js):

```bash
# everywhere on this machine, for every agent you have installed
npx skills add ihor-romanchuk/arch-diagram-kit --skill architecture-diagrams -g

# only in the current project (commits it to the project's agent folders)
npx skills add ihor-romanchuk/arch-diagram-kit --skill architecture-diagrams

# only for Claude Code
npx skills add ihor-romanchuk/arch-diagram-kit --skill architecture-diagrams -g -a claude-code

# after you change the skill in this repo
npx skills update architecture-diagrams -g

# check what is installed
npx skills list -g
```

While the repo is private, these commands only work on machines where git can read your GitHub account.

### Claude app (claude.ai, desktop, mobile)

The app does not use the CLI. Pick one:

- **Personal account:** ask Claude *"propose the architecture-diagrams skill from github.com/ihor-romanchuk/arch-diagram-kit"* and save it from the card, or upload the skill folder in Settings, under Skills. Repeat after you change the skill.
- **Enterprise account:** check whether your organisation allows custom skills. If yes, add it the same way (or ask an admin to add it for the whole organisation). If not, create a Claude Project for the client and paste the body of `SKILL.md` into the Project instructions, with `catalog.md`, `house-style.md` and the project's `PROJECT.md` as Project knowledge.

## Start a new project (about 30 minutes)

1. Copy `project-template/PROJECT.md` into the project, usually `docs/architecture/PROJECT.md`.
2. Fill in **Basics** and **People and approvals**.
3. Fill in the **Systems registry**. Ask Claude: *"Here are the existing diagrams/docs: build the systems and integrations registry for PROJECT.md."*
4. Draw the first two diagrams: **System context** and either the **Integration map** (integration projects) or the **Container** diagram (build projects).
5. Get them approved, set the status to Approved, publish them.

## The viewer and its commands

The kit is also a small command, `arch-diagrams`. A project needs no copy of it: run it with `npx`
from the project's root, pinned to a tag. It needs Node.js 20 or later, and Chrome for exports.

```bash
npx -y github:ihor-romanchuk/arch-diagram-kit#v0.3.1 serve --open    # viewer on http://localhost:4800
npx -y github:ihor-romanchuk/arch-diagram-kit#v0.3.1 export          # SVGs in diagrams/_rendered/, fails on errors
npx -y github:ihor-romanchuk/arch-diagram-kit#v0.3.1 build           # .diagrams-site/, the copy to publish
```

It reads `docs/architecture/diagrams/*.mmd`, `docs/architecture/PROJECT.md` and, if there is one,
`docs/architecture/theme.json`. Use `--dir`, `--project` and `--theme` when a project keeps them
somewhere else. Add `.diagrams-site/` to the project's
`.gitignore`.

| Command | What it does |
|---|---|
| `serve` | The viewer on localhost. It lists every diagram (link per diagram: `#int-01`) in the order of the Diagram index in `PROJECT.md`, then by ID, with pan, zoom and full screen. When you save a `.mmd` file or `PROJECT.md`, the open diagram draws again in less than a second, with the same zoom. A syntax error shows above the last good version. |
| `export` | An SVG (and a PNG with `--png`, taken by Chrome) of each diagram in `<folder>/_rendered/`, with the statuses by colour. It fails when a diagram has an error, so it is also the render check for CI. |
| `build` | The viewer, `manifest.json` and the `.mmd` files in one folder that works with no server. It prints the files to publish. |

### What the viewer shows

- **Full screen.** The **Full screen** button shows the toolbar, the diagram, the notes and the key
  on the full screen, with pan and zoom. Click the button again or push Esc to go back. Where a frame
  does not allow the browser's full screen, the viewer covers the window instead.
- **Statuses by colour.** The viewer reads the status tags (see [Statuses](#statuses-in-the-diagrams)),
  removes them from the labels and shows each status by its colour and line. A key under the
  diagram gives the statuses that the diagram uses.
- **Show.** The **Show** row highlights one status and dims the rest: *Done*, *Planned*, *Open*
  or *To confirm*. It works for links, messages, transitions and boxes, in every diagram type. A
  box stays clear when a link that the filter shows starts or ends on it. The row shows only the
  statuses that the diagram uses.
- **A short head.** Above the diagram are the title, the ID, the status, the diagram list and the
  first sentence of the `%% notes:` line, over the full width. The rest of that line and the other
  header fields (owner, verified date, file) are in **About this diagram** under the diagram.
- **Integrations in this diagram.** The table under the diagram gives the Integrations registry
  rows of each `I-xx` in the diagram: in link labels, messages or transitions. Click a row to show
  that integration and zoom to it. Click a label to find its row. The filter applies to the table too.
- **Notes.** The `%% note` lines (house style, section 2) show in a rail beside the diagram. The
  code of each note is in a circle on the first item that the note names. The links go both ways:
  - Click a note: the viewer highlights its items and zooms to them. Hover a note to see its items.
  - Click or hover a circled code: the viewer highlights its note in the rail and scrolls to it.
  - Click an item (a box, a participant, a link or a message): the viewer marks the notes about it
    and scrolls to the first.
  Search the notes, or show only the points to confirm.
- **Yellow means "to confirm", and nothing else.** Mermaid's own notes (`Note over`, `note right
  of`) are yellow by default. The viewer and `export` make them neutral grey for every diagram, so
  yellow is only the house `tbc` class and the `TBC` tag. The key says what yellow means and what
  the circled codes are.

### Statuses in the diagrams

One convention gives the status of an item in every diagram type. End the item's label with
` · ` and the status:

| Item | Example |
|---|---|
| Flowchart link | `bc -.->\|"I-01 · sends paid orders<br/>webhook · DONE"\| mw` |
| Link with no words | `w_kill -->\|"· TBC"\| m_refund` |
| Sequence message | `mw->>titan: I-05 · Release with the tote ID · PLANNED · TBC` |
| State transition | `af --> ca: Every line rejected · TBC` |
| Box, or Mermaid note | `m_split1["Split point 1 · TBC"]`, `Note over mw: Held for the gate · OPEN` |
| Link to remove | `bc -.->\|"I-16 · BAPO webhook · RETIRING (replaced by I-01)"\| mom` |

There are three statuses, and two marks for a link that goes away:

| Word | "Show" button | Meaning | Line |
|---|---|---|---|
| `DONE` | Done | Built: live or in test | Solid blue |
| `PLANNED` | Planned | Agreed or being built, not done yet | Dashed orange |
| `OPEN` | Open | Not decided yet | Dotted amber |
| `RETIRING` | Planned | To be removed: the removal is still to do | Dashed orange, label struck through |
| `RETIRED` | Done | Removed | Solid blue, label struck through |
| `TBC` | To confirm | Not decided yet: give it a `[to confirm]` note | Yellow label or box |

Rules:

- The tag is the **last** part of the label, and the words are in capitals. `TBC` can follow a
  status (`· PLANNED · TBC`) or stand alone (`· TBC`). After `RETIRING` or `RETIRED`, the label
  shows both marks: it is struck through, and it is yellow.
- Words after the status stay in the label: `· PLANNED Q1` shows "Q1", and `· RETIRING (replaced by
  I-04)` shows "(replaced by I-04)".
- Boxes can also take their status from the house classes: `planned` is `PLANNED`, `tbc` is `TBC`.
- A link or message with no tag takes, in this order: the status of its `I-xx` in the Integrations
  registry (when the label has one `I-xx` only), then the header's `%% status-default: <STATUS>`.
  Use `status-default` when most items share one status, for example `DONE` on a diagram of
  built behaviour, and tag only the others.
- The kit also reads older words: `LIVE` and `IN TEST` are `DONE`, `IN BUILD` is `PLANNED`,
  `PROPOSED` is `OPEN`. Write the new words.
- The kit does not read a tag in the label of an `opt`, `alt` or `loop` block.
- Do not add `linkStyle` lines or "(built)" / "(not built)" words for status. The tag does both.
- On GitHub and in other plain Mermaid renderers, the tag shows as text. That is correct.

`export` uses the same convention: the SVGs and PNGs in `_rendered/` show the statuses by colour,
with the tags removed and Mermaid's notes in grey. Its files have no key.

**The key for the circled codes.** Put the text in a `## Note codes` section of `PROJECT.md`: the
first paragraph goes in the key of every diagram. A diagram can have its own text in a header line,
`%% note-codes: <text>`. With neither, the key gives a short general text.

### Project themes

A project can show its diagrams and the viewer in its own brand. Put a `theme.json` beside
`PROJECT.md` (or give its path with `--theme`). The `.mmd` files keep the house colours; the
viewer and `export` change them as the theme says, so the diagrams stay the same on every project.

```json
{
  "name": "Acme",
  "fonts": {
    "stylesheet": "https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap",
    "heading": "Inter, Arial, sans-serif",
    "body": "Arial, Helvetica, sans-serif"
  },
  "light": { "--bg": "#F4F7F9", "--accent": "#0B5FFF", "--accent-ink": "#FFFFFF" },
  "dark": { "--bg": "#0B1220", "--accent": "#6EA0FF", "--accent-ink": "#0B1220" },
  "recolor": { "#1F6FA8": "#0B5FFF", "#15527D": "#0847BF" }
}
```

| Key | What it does |
|---|---|
| `fonts.stylesheet` | A Google Fonts stylesheet. It must be a `https://fonts.googleapis.com/` URL, because a published claude.ai page loads fonts only from there. |
| `fonts.heading`, `fonts.body` | The CSS font lists for the viewer's headings and text |
| `light`, `dark` | Values for the viewer's CSS variables (`--bg`, `--surface`, `--fg`, `--muted`, `--line`, `--accent`, `--accent-ink`, `--sel` and others in `viewer/index.html`), for light and dark mode |
| `recolor` | House colour → project colour, as `#RRGGBB`. It applies to every colour in the diagram text: the header's theme variables, `classDef` and `style` lines. `export` uses it too, so the SVGs in `_rendered/` have the project's colours. |

Keep the meaning of each class when you change its colour: `planned` must still look different
from built, and `tbc` must still stand out. `recolor` also applies to the status colours and to the
grey of Mermaid's notes, so map a house colour only to a colour that keeps its meaning.

The viewer pins Mermaid 11.17.2 and draws the same picture as the export. Cursor's preview and
mermaid.live can look different: they use their own Mermaid version and settings.

To try it on the worked example, run `npm run demo` in this repo. To work on the kit itself, run it
from a clone: `node ~/Work/arch-diagram-kit/bin/arch-diagrams.mjs serve` in the project's root.
For a new version, change `package.json`, tag it (for example `v0.4.0`), push the tag, and change the pin in
each project's `PROJECT.md`.

## Everyday use

Talk to Claude normally. The skill picks the type, applies the style and checks the result:

- *"Draw the integration map for the order platform."*
- *"Update INT-01: the CRM integration moves to Q3 and uses SQS instead."*
- *"Review this diagram against the house style."* (paste Mermaid or an image)
- *"Convert this HTML diagram from the team into our format."*
- *"Start a live session on PRC-01."*

## Live sessions with stakeholders

1. Before the call, open Claude Code in the project and say *"Start a live session on <ID>"*. Claude starts `serve` and gives you the viewer link, `http://localhost:4800/#<id>`.
2. Share the viewer window on Teams, Zoom or Meet.
3. As people talk, type or dictate short change requests: *"move invoicing to Finance", "add a manual approval step after payment"*. Claude edits the `.mmd` and confirms each change in one line. The viewer shows the change as soon as the file is saved.
4. At the end say *"End session"*. Claude gives you the decisions for `PROJECT.md` and the new status (usually In review), and publishes the shared viewer.

In a Claude chat with no shell (claude.ai), the session works as before: Claude redraws the diagram in the chat for each change.

There is no reliable way to stream call audio into Claude. Typing or dictating the change yourself is faster and filters out noise.

## Publishing

The `.mmd` file is the source. Publish where the team works:

| Where | How |
|---|---|
| One link for every diagram of the project | Run `build`, then Claude publishes `.diagrams-site/` as one claude.ai artifact: the page is `index.html`, the other files are the ones `build` prints. Record the link in `PROJECT.md` and publish to the same link every time; open pages get each update. The link is private until you share it. |
| GitHub (README, docs, PRs) | Paste the Mermaid text into a ` ```mermaid ` code block. GitHub renders it. |
| Azure DevOps wiki | Use a `::: mermaid` block. Its Mermaid version is older; if a diagram fails, publish the SVG from `export`. |
| Notion | Code block, language "Mermaid". |
| Confluence | No built-in Mermaid. Use a Mermaid app from the Marketplace if the client has one; otherwise attach the SVG and link to the `.mmd` file. |
| Slides, email | SVG or PNG from `export --png`. |

Always link back to the `.mmd` file, so nobody edits the picture.

## Rendering and checking

```bash
npx -y github:ihor-romanchuk/arch-diagram-kit#v0.3.1 export          # SVG, fails on any syntax error
npx -y github:ihor-romanchuk/arch-diagram-kit#v0.3.1 export --png    # also PNG for slides
```

Run it before every commit, or in CI. `scripts/render.sh [folder] [--png]` in this repo does the same.

## When a project outgrows plain Mermaid

On a long project with many people drawing the same systems, consider a single model in Structurizr DSL that generates the C4 views and exports them to Mermaid. Keep the same catalog, names and statuses. Until then, the Systems registry in `PROJECT.md` does the same job: one list of names for every diagram.
