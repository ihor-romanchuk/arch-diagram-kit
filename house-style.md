# House style

These rules apply to every diagram on every project. A diagram is "done" only when it passes the review checklist at the end.

## 1. One source format: Mermaid text

- The source of truth for every diagram is a `.mmd` file with Mermaid text.
- PNG, SVG, HTML pages, Confluence images and slides are **exports**. They are never edited directly and never treated as the source.
- Do not ask Claude to "draw a diagram as an HTML page". Ask for the Mermaid source. Wrap it in HTML only for presentation, after the source is saved.
- One diagram per file.

## 2. Every file starts with the same header

```
---
title: <System or scope> · <Diagram type>
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
%% id: INT-01
%% type: integration-map
%% audience: business+tech
%% status: Draft
%% owner: <name>
%% approved-by: <name, date or empty>
%% last-verified: 2026-11-04
%% notes: <one line: what this diagram answers>
%% note G1 node_id: <a note on one box, shown in the viewer's notes rail>
%% note T1 node_id [to confirm]: <a point that is not decided yet>
%% status-default: <optional: the status of every link or message with no tag, see section 7>
%% note-codes: <optional: what this diagram's note codes are, for the viewer's key>
```

| Field | Rule |
|---|---|
| `title` | `<scope> · <type>`, shown on the rendered diagram |
| `id` | Type prefix + number from the catalog (`CTX`, `INT`, `PRC`, `CON`, `SEQ`, `STA`, `ERD`, `DEP`). Never reused. |
| `audience` | `business`, `tech` or `business+tech` |
| `status` | See section 3 |
| `last-verified` | The date someone last checked the diagram against reality |
| `notes` | The question this diagram answers, in one sentence. The viewer shows the first sentence above the diagram and the rest under it. |
| `note` | Optional, as many as necessary. `%% note <code> [targets] [to confirm]: <text>`. The code is short and unique in the file (`G1`, `T1`). The targets are node IDs, sequence participant IDs or integration IDs (`I-04`), separated by commas, with no spaces. A line that starts with `%%` and two or more spaces continues the note above. The viewer puts the code in a circle on the first target and lists the notes beside the diagram. Mark a point that is not decided with `[to confirm]`: the viewer shows it in yellow and can show only those. |
| `status-default` | Optional. A status word from section 7 for every link, message or transition that has no tag. |
| `note-codes` | Optional. One line for the viewer's key: what the note codes of this diagram are. The project-wide text goes in a `## Note codes` section of `PROJECT.md`. |

Keep both `fontFamily` lines. Mermaid 11 uses only the one directly under `config:`; without it, every renderer falls back to its default font.

Some renderers run old Mermaid versions and ignore the `config` block. That is fine: the diagram still renders, just with default colours. View diagrams with `arch-diagrams serve` and export them with `arch-diagrams export` when the colours matter (see the README).

## 3. Statuses

| Status | Meaning |
|---|---|
| **Draft** | Work in progress or a proposal for discussion. Anything goes. |
| **In review** | Shared with the approvers listed in `PROJECT.md`. |
| **Approved** | Signed off. This is the source of truth. Fill `approved-by`. |
| **Superseded** | Replaced. Keep the file and add `%% superseded-by: <id>`. |

- Changing the **meaning** of an Approved diagram (a new system, a new or removed link, a changed flow) sets it back to **In review**.
- Cosmetic changes (layout, typos, wording that keeps the meaning) keep it **Approved**. Update `last-verified`.
- Proposals for change go in a new Draft file (`...--proposal-<topic>.mmd`), not into the Approved file.

## 4. Names and IDs

- Use system names **exactly** as written in the Systems registry in `PROJECT.md`. If a new system appears, add it to the registry first.
- Mermaid node IDs are short snake_case (`order_svc`, `sap_erp`). Keep them **stable** between edits so diffs stay readable.
- Integrations carry their registry ID in the arrow label (`I-04 · ...`).

## 5. Colour key

Paste this block at the end of every flowchart. Use the same classes on every project.

```
  classDef person fill:#0B3D5C,stroke:#0B3D5C,color:#ffffff
  classDef internal fill:#1F6FA8,stroke:#15527D,color:#ffffff
  classDef managed fill:#FDF0DC,stroke:#D98200,stroke-width:1.5px,color:#3D2600
  classDef external fill:#E8EDF1,stroke:#7A8A97,color:#1C2A35
  classDef store fill:#DDEFE6,stroke:#3C8D6B,color:#12352A
  classDef planned fill:#FFFFFF,stroke:#C2410C,stroke-width:2px,stroke-dasharray:6 4,color:#7C2D12
  classDef tbc fill:#FFF0A8,stroke:#C07A1A,color:#5C4A00
```

| Class | Use for | Example |
|---|---|---|
| `person` | People and roles | Customer, Support agent |
| `internal` | Systems and code we own | Order Service (Node.js · Lambda) |
| `managed` | Cloud managed services (AWS, Azure, GCP) | API Gateway, EventBridge, Cognito |
| `external` | Other companies' or other teams' systems | Stripe, SAP ERP, 3PL Warehouse |
| `store` | Databases, queues, buckets, caches | Aurora PostgreSQL, SQS |
| `planned` | Any box that does not exist yet | New CRM, planned service |
| `tbc` | A box whose content is not confirmed yet. Give it a `[to confirm]` note that says what is open. Yellow means this only. | A step that a vendor must confirm |

A project can show these colours in its own brand without a change to the `.mmd` files: see
"Project themes" in the README.

Links, messages and transitions get their status from a tag at the end of the label, not from
`linkStyle` (section 7). The viewer and `export` colour them.

Mermaid's own notes (`Note over`, `note right of`) are yellow by default. The viewer and `export`
make them neutral grey, so yellow means "to confirm" only. Do not set note colours in the header.

## 6. Boxes

- Format: `["<b>Name</b><br/>Role or technology"]`.
- Technology line: `language · runtime`, for example `Node.js · ECS Fargate` or `Aurora PostgreSQL`.
- Shapes: `[( )]` for databases, `[[ ]]` for queues and buses, `([ ])` for start and end in processes, `{ }` for decisions.

## 7. Arrows

- Every arrow has a label: a verb phrase, plus the protocol in brackets for tech diagrams: `Charges card [REST]`.
- The arrow points from whoever **initiates** to whoever is called.
- Line styles: `-->` synchronous call, `-.->` asynchronous message or event.

### Statuses: one tag for every diagram type

End the label of a link, sequence message, state transition, box or Mermaid note with ` · ` and a
status word in capitals. The viewer and `export` remove the tag and show the status by colour, with
a key under the diagram. The viewer's **Show** filter uses the same words.

| Word | Group in "Show" | Meaning |
|---|---|---|
| `DONE` | Done | Built: live or in test |
| `PLANNED` | Planned | Agreed or being built, not done yet |
| `OPEN` | Open | Not decided yet |
| `RETIRING` | Planned | To be removed; the label is struck through |
| `RETIRED` | Done | Removed; the label is struck through |
| `TBC` | To confirm | Not decided yet; give it a `[to confirm]` note |

```
  bc -.->|"I-01 · sends paid orders<br/>webhook · DONE"| mw
  shop == "I-04 · EventBridge events · PLANNED Q1" ==> sap
  bc -.->|"I-16 · BAPO webhook · RETIRING (replaced by I-01)"| mom
  w_kill -->|"· TBC"| m_refund
  mw->>titan: I-05 · Release with the tote ID · PLANNED · TBC
  af --> ca: Every line rejected · TBC
  Note over mw: Held for the gate · OPEN
```

- The tag is the last part of the label. `TBC` can follow a status or stand alone. A
  `RETIRING · TBC` or `RETIRED · TBC` label is struck through and yellow.
- Words after the status word stay in the label (`PLANNED Q1`, `RETIRING (replaced by I-04)`).
- A link with no words gets a label of the tag alone: `|"· TBC"|`.
- A box can also use the classes `planned` and `tbc`.
- A link or message with no tag takes its integration's status from the Integrations registry, then
  the header's `status-default`.
- The older words still work (`LIVE` and `IN TEST` are `DONE`, `IN BUILD` is `PLANNED`, `PROPOSED`
  is `OPEN`), but write the new ones.
- Do not write the status as words, such as "(built)" or "(not built)", and do not use `linkStyle`
  for it.

## 8. Size

- At most **20 boxes** per diagram and **one abstraction level** per diagram. When it gets bigger, split it and link the files.
- Sequence diagrams: at most 8 participants and about 20 steps. Use `autonumber`.
- Do not shrink text to make more fit. Split instead.

## 9. Layout

- `TB` (top to bottom) for hierarchies: context, container, deployment.
- `LR` (left to right) for flows: integration maps, processes.
- People at the top, our system in the middle, external systems at the bottom or the right.
- Use `subgraph` for boundaries (our system, a VPC, a swimlane). Name every subgraph.

## 10. Files and folders

On each project, diagrams live in one folder, usually `docs/architecture/diagrams/`:

```
<type>--<scope>.mmd               context--order-platform.mmd
<type>--<scope>--<topic>.mmd      sequence--checkout--3ds.mmd
<type>--<scope>--proposal-<x>.mmd integration--order-platform--proposal-eventbridge.mmd
```

Never rename an Approved file: people link to it.

## 11. Review checklist

Run this before you share any diagram.

1. The header is complete: title, id, type, audience, status, owner, last-verified.
2. It is the right type for the question in `notes` (see `catalog.md`).
3. It stays at one abstraction level.
4. Every name matches the Systems registry.
5. Every box uses a colour-key class; planned items are styled as planned.
6. Every arrow has a label; tech diagrams include the protocol.
7. It has no more than 20 boxes (or 8 participants for a sequence).
8. Integration arrows carry their `I-xx` ID and a status tag; other statuses use the tags of section 7, not words.
9. The audience can read it: no technology names on business diagrams unless they matter to the decision.
10. It renders without errors.
