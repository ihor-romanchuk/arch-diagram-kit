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
```

| Field | Rule |
|---|---|
| `title` | `<scope> · <type>`, shown on the rendered diagram |
| `id` | Type prefix + number from the catalog (`CTX`, `INT`, `PRC`, `CON`, `SEQ`, `STA`, `ERD`, `DEP`). Never reused. |
| `audience` | `business`, `tech` or `business+tech` |
| `status` | See section 3 |
| `last-verified` | The date someone last checked the diagram against reality |
| `notes` | The question this diagram answers, in one line |

Some renderers run old Mermaid versions and ignore the `config` block. That is fine: the diagram still renders, just with default colours. Export SVG with `scripts/render.sh` when the colours matter.

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
```

| Class | Use for | Example |
|---|---|---|
| `person` | People and roles | Customer, Support agent |
| `internal` | Systems and code we own | Order Service (Node.js · Lambda) |
| `managed` | Cloud managed services (AWS, Azure, GCP) | API Gateway, EventBridge, Cognito |
| `external` | Other companies' or other teams' systems | Stripe, SAP ERP, 3PL Warehouse |
| `store` | Databases, queues, buckets, caches | Aurora PostgreSQL, SQS |
| `planned` | Any box that does not exist yet | New CRM, planned service |

Planned **links** get this style (list the link numbers, counting from 0):

```
  linkStyle 3,5 stroke:#C2410C,stroke-width:2px,stroke-dasharray:6 4
```

## 6. Boxes

- Format: `["<b>Name</b><br/>Role or technology"]`.
- Technology line: `language · runtime`, for example `Node.js · ECS Fargate` or `Aurora PostgreSQL`.
- Shapes: `[( )]` for databases, `[[ ]]` for queues and buses, `([ ])` for start and end in processes, `{ }` for decisions.

## 7. Arrows

- Every arrow has a label: a verb phrase, plus the protocol in brackets for tech diagrams: `Charges card [REST]`.
- The arrow points from whoever **initiates** to whoever is called.
- Line styles: `-->` synchronous call, `-.->` asynchronous message or event, thick dashed orange (`linkStyle`) = planned.
- Integration maps add the status at the end of the label: `LIVE`, `PLANNED Q1`, `RETIRING`.

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
8. Integration arrows carry their `I-xx` ID and status.
9. The audience can read it: no technology names on business diagrams unless they matter to the decision.
10. It renders without errors.
