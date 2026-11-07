---
name: architecture-diagrams
description: Create, update, review and live-edit architecture diagrams in Mermaid using my catalog, house style and the project's PROJECT.md. Use for any architecture, integration, process, data or deployment diagram.
---

# Architecture diagrams

Every diagram follows one catalog, one house style and one source format, on every project and every Claude account. The rules below are complete; the `arch-diagram-kit` repo holds the same rules plus worked examples.

## Non-negotiables

1. **Mermaid is the source.** Always produce Mermaid text. Never hand-write HTML, SVG or canvas drawings as the diagram. If a rendered view is wanted, render the Mermaid (artifact, preview or `mmdc`); wrapping it in a page is presentation only.
2. **Names come from the project.** Use system names exactly as in the Systems registry of `PROJECT.md`. Map meeting names ("the ERP", "OMS") through the "Also called" column. If a system is not in the registry, say so and propose a registry row before drawing it.
3. **One question, one type, one abstraction level** per diagram.
4. **Every diagram gets the standard header and the colour key** (below).
5. **Run the review checklist before showing a diagram.** Fix failures; do not list passed checks.

## Step 0: load context

- Look for the project file: `docs/architecture/PROJECT.md`, `PROJECT.md`, or project knowledge / an attached file named PROJECT.md.
- If there is none: ask once whether to create one from the template (Basics, People and approvals, Systems registry, Integrations registry, Glossary, Diagram index, Decisions). If the user wants to proceed without it, draw anyway, mark the diagram Draft, and list the names you assumed.
- For updates, load the existing `.mmd` first. Never redraw from memory.

## Step 1: pick the type

| Type | ID | Audience | Use when the question is... | Mermaid |
|---|---|---|---|---|
| System context | CTX | Business | What is this system, who uses it, what does it depend on? | `flowchart TB` |
| Integration map | INT | Business + tech | Which systems are connected, how, and what is live or planned? | `flowchart LR` |
| Business process | PRC | Business | Who does what, in what order, and what happens when it fails? | `flowchart LR`, one subgraph per lane with `direction TB` |
| Container | CON | Tech | What are the building blocks inside one system and their technologies? | `flowchart TB`, boundary subgraph |
| Sequence | SEQ | Tech | In one scenario, who calls whom, in what order? | `sequenceDiagram` with `autonumber` |
| State | STA | Tech, product | What is the lifecycle of one entity and which transitions are allowed? | `stateDiagram-v2` |
| ER | ERD | Tech | What data do we keep and how is it related? | `erDiagram` |
| Deployment | DEP | Tech: ops, security | Where does everything run: accounts, regions, networks? | `flowchart TB`, nested subgraphs |

What each must show:
- **CTX:** our system as ONE box; all user types; all external dependencies; verb-phrase labels. No internals, no protocols.
- **INT:** each system once; one arrow per integration labelled `I-xx · mechanism · STATUS`; what replaces what.
- **PRC:** one lane per party; start and end; labelled decisions; unhappy paths. No tech names unless needed for the decision.
- **CON:** apps, services, stores, queues inside a named boundary; tech line `language · runtime`; externals outside; protocol on every arrow.
- **SEQ:** max 8 participants, about 20 steps; `->>` sync, `-)` async, `-->>` response; show when state changes.
- **STA:** every state, every allowed transition with its trigger, end states; one entity only.
- **ERD:** entities, key attributes with types, PK/FK, cardinality, verb on each relationship. Not every column.
- **DEP:** account and region, VPC and subnets, where each container runs, managed services, links to on-prem/other clouds. Logical view, no icons.

If the request does not fit, pick the closest type and say which question it answers. If two types fit, ask which question matters, or draw the business one first for business audiences.

Defaults when the client stack is unknown: AWS services and Node.js. Otherwise use the stack in `PROJECT.md`.

## Step 2: draw

### Header (every file)

```
---
title: <Scope> · <Diagram type>
config:
  theme: base
  fontFamily: "Arial, Helvetica, sans-serif"
  themeVariables:
    fontFamily: "Arial, Helvetica, sans-serif"
    primaryColor: "#EAF2F9"
    primaryBorderColor: "#1F6FA8"
    primaryTextColor: "#1C2A35"
    lineColor: "#4B5B68"
    secondaryColor: "#F3F6F8"
    tertiaryColor: "#FFFFFF"
---
%% id: <PREFIX>-<NN>
%% type: <system-context|integration-map|business-process|container|sequence|state|erd|deployment>
%% audience: <business|tech|business+tech>
%% status: <Draft|In review|Approved|Superseded>
%% owner: <name>
%% approved-by: <name, date or empty>
%% last-verified: <YYYY-MM-DD>
%% notes: <the one question this diagram answers>
%% note <code> <target,target> [to confirm]: <optional: a note on boxes; see below>
```

Keep both `fontFamily` lines: Mermaid 11 uses only the one directly under `config:`, and without it every renderer except a configured one falls back to its default font.

New diagrams start as **Draft**. Take the next free ID from the Diagram index.

**Notes.** Put the reasons, sources and open points that a reader needs in `%% note` lines, not in the boxes: `%% note G1 m_rule,p_check: <text>`. The code is short and unique in the file. The targets are node IDs or `I-xx`, separated by commas with no spaces, and are optional. Add `[to confirm]` before the colon for a point that is not decided, and say what is open and who decides it. A line that starts with `%%` and two or more spaces continues the note. The kit's viewer shows the notes in a rail, with the code in a circle on the first target. Keep box labels short and move the detail to notes.

### Colour key (end of every flowchart)

```
  classDef person fill:#0B3D5C,stroke:#0B3D5C,color:#ffffff
  classDef internal fill:#1F6FA8,stroke:#15527D,color:#ffffff
  classDef managed fill:#FDF0DC,stroke:#D98200,stroke-width:1.5px,color:#3D2600
  classDef external fill:#E8EDF1,stroke:#7A8A97,color:#1C2A35
  classDef store fill:#DDEFE6,stroke:#3C8D6B,color:#12352A
  classDef planned fill:#FFFFFF,stroke:#C2410C,stroke-width:2px,stroke-dasharray:6 4,color:#7C2D12
  classDef tbc fill:#FFF0A8,stroke:#C07A1A,color:#5C4A00
```

- `person` people and roles; `internal` systems and code we own; `managed` cloud managed services (API Gateway, EventBridge, Cognito...); `external` other companies' or teams' systems; `store` databases, queues, buckets; `planned` boxes that do not exist yet; `tbc` boxes whose content is not confirmed (give each a `[to confirm]` note).
- The registry's Class column decides the class.
- Planned links: `linkStyle <n,m> stroke:#C2410C,stroke-width:2px,stroke-dasharray:6 4` (links count from 0 in declaration order).
- Process diagrams use their own step classes: white steps with blue border, amber decisions (`fill:#FFF4E5,stroke:#B45309`), dark-blue rounded start/end nodes.

### Boxes and arrows

- Box text: `["<b>Name</b><br/>Role or technology"]`. Shapes: `[( )]` database, `[[ ]]` queue/bus, `([ ])` start/end, `{ }` decision.
- Node IDs: short snake_case, stable across edits.
- Every arrow has a label: verb phrase, plus `[protocol]` on tech diagrams. Arrow points from the initiator.
- `-->` sync call, `-.->` async message/event, planned links styled as above.
- Max 20 boxes. If more, split into linked diagrams and say so; never shrink.
- `TB` for hierarchies, `LR` for flows. People top, our system middle, externals bottom/right. Name every subgraph.

## Step 3: review checklist

1. Header complete. 2. Right type for the question in `notes`. 3. One abstraction level. 4. Names match the registry. 5. Colour classes on every box; planned items styled. 6. Every arrow labelled; protocols on tech diagrams. 7. Within size limits. 8. Integrations carry `I-xx` and status. 9. Readable by the stated audience. 10. Renders: when a shell is available, run the kit's `export` (or `mmdc -i file.mmd -o /tmp/check.svg`); otherwise check syntax carefully (quote labels with special characters, `<br/>` for line breaks, no unescaped parentheses in unquoted labels).

## Step 4: output

- **Diagram kit.** When a shell and Node.js are available, use the `arch-diagrams` command of the arch-diagram-kit repo, from the project root, at the version that `PROJECT.md` pins (else the latest tag): `npx -y github:ihor-romanchuk/arch-diagram-kit#<version> serve` (localhost viewer, pan and zoom, reloads on save), `export` (SVGs in `diagrams/_rendered/`; this is the render check in step 3), `build` (the copy to publish). Nothing of the kit is copied into the project. Do not hand-build a page per diagram. A project's brand goes in `docs/architecture/theme.json` (fonts, viewer colours, and `recolor` from house colours to brand colours); never change the house colours in the `.mmd` files for a brand.
- Show the rendered diagram when the environment can (the kit's viewer, Mermaid artifact, preview or rendered SVG).
- Give the full `.mmd` content in one ```mermaid block, with the suggested file name: `<type>--<scope>[--<topic>].mmd` (types: context, integration, process, container, sequence, state, erd, deployment).
- If the diagram is new or its status changed, give the row to add or change in the `PROJECT.md` Diagram index. If new systems or integrations appeared, give the registry rows.
- When a repo or folder is available, write the file to `docs/architecture/diagrams/` (or the folder named in `PROJECT.md`) instead of only printing it.
- Keep the surrounding text short: what it shows, any assumptions, open questions.

## Modes

### Create
Steps 0 to 4. Ask at most one question first, and only if the type or scope is truly unclear; otherwise draw and list assumptions.

### Update ("update INT-01: ...")
- Load the current file. Change only what was asked. Keep node IDs, order and layout so the diff stays small.
- Status: meaning changed on an Approved diagram → set **In review**; cosmetic change → stays Approved. Always update `last-verified`.
- For a *proposal* against an Approved diagram, create `...--proposal-<topic>.mmd` as Draft instead of editing the original.
- Finish with a 1-to-5-line change list.

### Live session ("start a live session on PRC-01")
The user is screen-sharing this chat with stakeholders.
- With the diagram kit: start `serve` in the background if it is not running, and tell the user to share the viewer at `http://localhost:4800/#<id>`. For each change, only edit the `.mmd`: the viewer shows it on save, so do not render it in chat. Keep each turn to the edit and the one line. On "end session", also run `export` and `build`, and publish `.diagrams-site/` to the shared viewer link in `PROJECT.md` (same URL every time).
- Load the diagram. Reply with the rendered diagram only and one line: "Live session on <ID>. Tell me the changes."
- For each change request: apply it, show the updated diagram, and reply with **one line**: "Changed: <what>." No explanations, no checklists, no questions unless the request is ambiguous; then ask one short question with options.
- Keep the layout stable between turns. Use only registry names; if someone names a new system, add it styled as `planned` and note it.
- Track every decision. On "end session": give the final `.mmd`, the decisions as rows for the `PROJECT.md` Decisions table (date, decision, diagram, agreed by: ask who agreed if unknown), registry changes, and the new status (Approved stays only if nothing meaningful changed; otherwise In review).

### Review ("review this diagram")
Input can be Mermaid, an image, an HTML page, draw.io or text. Check against the catalog and the checklist. Report only the problems, most important first, each with the fix. Then offer the corrected Mermaid.

### Import ("convert this into our format")
For diagrams other people made (HTML pages, images, draw.io, PlantUML, slides):
- Identify the type from the catalog. Map every name to the registry; list names that did not match.
- Rebuild in Mermaid with the header (status Draft, `notes` saying where it came from) and the colour key.
- List what was dropped or changed and why (mixed levels split, unlabelled arrows guessed, and so on).

### Registry bootstrap ("build the registry from these docs")
Read the material given (diagrams, docs, tickets). Produce the Systems registry and Integrations registry tables in `PROJECT.md` format, with "Also called" filled from the variants found. Flag conflicts (same system, different names; same integration, different mechanisms) as open questions.

## Publishing hints

- Shared reference: with the diagram kit, run `build` and publish `.diagrams-site/index.html` with the files it prints as one claude.ai artifact, always to the shared viewer link recorded in `PROJECT.md` (create it on the first publish and record it there). Each publish updates open pages; the link is private until the user shares it.
- GitHub: ```mermaid block. Azure DevOps wiki: `::: mermaid` block (older Mermaid; fall back to SVG if it fails). Notion: code block, language Mermaid. Confluence: Mermaid marketplace app if available, otherwise attach SVG and link to the `.mmd`.
- Exports (SVG, PNG) are never edited; regenerate them from the `.mmd`.
