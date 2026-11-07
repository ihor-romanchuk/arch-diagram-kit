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
├── viewer/index.html         the viewer page: pan, zoom, diagram list, linked registry
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
npx -y github:ihor-romanchuk/arch-diagram-kit#v0.1.0 serve --open    # viewer on http://localhost:4800
npx -y github:ihor-romanchuk/arch-diagram-kit#v0.1.0 export          # SVGs in diagrams/_rendered/, fails on errors
npx -y github:ihor-romanchuk/arch-diagram-kit#v0.1.0 build           # .diagrams-site/, the copy to publish
```

It reads `docs/architecture/diagrams/*.mmd` and `docs/architecture/PROJECT.md`. Use `--dir` and
`--project` when a project keeps them somewhere else. Add `.diagrams-site/` to the project's
`.gitignore`.

| Command | What it does |
|---|---|
| `serve` | The viewer on localhost. It lists every diagram (link per diagram: `#int-01`), with pan and zoom. When you save a `.mmd` file or `PROJECT.md`, the open diagram draws again in less than a second, with the same zoom. A syntax error shows above the last good version. |
| `export` | An SVG (and a PNG with `--png`) of each diagram in `<folder>/_rendered/`. It fails when a diagram has an error, so it is also the render check for CI. |
| `build` | The viewer, `manifest.json` and the `.mmd` files in one folder that works with no server. It prints the files to publish. |

In the viewer, click an edge label (`I-xx · …`) or a row of the integrations table under the
diagram to show that integration and its two systems; a row click also zooms to it. The filters
show integrations by status: built or in test, not built yet, or retiring. The rows come from the
Integrations registry in `PROJECT.md`.

The viewer pins Mermaid 11.17.2 and draws the same picture as the export. Cursor's preview and
mermaid.live can look different: they use their own Mermaid version and settings.

To try it on the worked example, run `npm run demo` in this repo. To work on the kit itself, run it
from a clone: `node ~/Work/arch-diagram-kit/bin/arch-diagrams.mjs serve` in the project's root.
For a new version, change `package.json`, tag it (`v0.2.0`), push the tag, and change the pin in
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
npx -y github:ihor-romanchuk/arch-diagram-kit#v0.1.0 export          # SVG, fails on any syntax error
npx -y github:ihor-romanchuk/arch-diagram-kit#v0.1.0 export --png    # also PNG for slides
```

Run it before every commit, or in CI. `scripts/render.sh [folder] [--png]` in this repo does the same.

## When a project outgrows plain Mermaid

On a long project with many people drawing the same systems, consider a single model in Structurizr DSL that generates the C4 views and exports them to Mermaid. Keep the same catalog, names and statuses. Until then, the Systems registry in `PROJECT.md` does the same job: one list of names for every diagram.
