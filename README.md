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
├── examples/brewbox/         a complete worked example (fictional shop on AWS + Node.js)
│   ├── PROJECT.md
│   ├── diagrams/*.mmd        one example of each type: use them as templates
│   ├── diagrams/_rendered/   SVG exports
│   └── catalog.html          all 8 examples on one page
└── scripts/
    └── render.sh             render all diagrams to SVG/PNG and check for errors
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

## Everyday use

Talk to Claude normally. The skill picks the type, applies the style and checks the result:

- *"Draw the integration map for the order platform."*
- *"Update INT-01: the CRM integration moves to Q3 and uses SQS instead."*
- *"Review this diagram against the house style."* (paste Mermaid or an image)
- *"Convert this HTML diagram from the team into our format."*
- *"Start a live session on PRC-01."*

## Live sessions with stakeholders

1. Before the call, open a Claude chat, load the diagram and say *"Start a live session on <ID>"*.
2. Share that window on Teams, Zoom or Meet.
3. As people talk, type or dictate short change requests: *"move invoicing to Finance", "add a manual approval step after payment"*. Claude redraws and confirms each change in one line.
4. At the end say *"End session"*. Claude gives you the final Mermaid, the list of decisions for `PROJECT.md`, and the new status (usually In review).

There is no reliable way to stream call audio into Claude. Typing or dictating the change yourself is faster and filters out noise.

## Publishing

The `.mmd` file is the source. Publish where the team works:

| Where | How |
|---|---|
| GitHub (README, docs, PRs) | Paste the Mermaid text into a ` ```mermaid ` code block. GitHub renders it. |
| Azure DevOps wiki | Use a `::: mermaid` block. Its Mermaid version is older; if a diagram fails, publish the SVG from `render.sh`. |
| Notion | Code block, language "Mermaid". |
| Confluence | No built-in Mermaid. Use a Mermaid app from the Marketplace if the client has one; otherwise attach the SVG and link to the `.mmd` file. |
| Slides, email | SVG or PNG from `scripts/render.sh --png`. |

Always link back to the `.mmd` file, so nobody edits the picture.

## Rendering and checking

```
scripts/render.sh docs/architecture/diagrams          # SVG, fails on any syntax error
scripts/render.sh docs/architecture/diagrams --png    # also PNG for slides
```

Run it before every commit, or in CI.

## When a project outgrows plain Mermaid

On a long project with many people drawing the same systems, consider a single model in Structurizr DSL that generates the C4 views and exports them to Mermaid. Keep the same catalog, names and statuses. Until then, the Systems registry in `PROJECT.md` does the same job: one list of names for every diagram.
