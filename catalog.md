# Diagram catalog

Eight diagram types cover the whole delivery cycle. All are written in Mermaid. Pick the type from the **question** you need to answer, then from the **audience**.

| # | Type | ID prefix | Audience | Answers the question | Mermaid syntax | Example |
|---|---|---|---|---|---|---|
| 1 | System context | `CTX` | Business | What is this system, who uses it, what does it depend on? | `flowchart TB` | `examples/brewbox/diagrams/context--brewbox.mmd` |
| 2 | Integration map | `INT` | Business + tech | Which systems are connected, how, and what is live or planned? | `flowchart LR` | `integration--brewbox.mmd` |
| 3 | Business process | `PRC` | Business | Who does what, in what order, and what happens when it fails? | `flowchart LR` + subgraph swimlanes | `process--brewbox--renewal.mmd` |
| 4 | Container | `CON` | Tech | What are the building blocks inside one system, and their technologies? | `flowchart TB` + boundary subgraph | `container--brewbox.mmd` |
| 5 | Sequence | `SEQ` | Tech | In one scenario, who calls whom, in what order? | `sequenceDiagram` | `sequence--brewbox--checkout-3ds.mmd` |
| 6 | State | `STA` | Tech (and product) | What is the lifecycle of one entity, and which transitions are allowed? | `stateDiagram-v2` | `state--brewbox--order.mmd` |
| 7 | ER (data model) | `ERD` | Tech | What data do we keep and how is it related? | `erDiagram` | `erd--brewbox.mmd` |
| 8 | Deployment | `DEP` | Tech (ops, security) | Where does everything run: accounts, regions, networks? | `flowchart TB` + nested subgraphs | `deployment--brewbox--prod.mmd` |

How they fit together: **1 → 4** zooms into one system; **2** sits beside 1 and shows connections across many systems; **3** is the business view of a flow, **5** is the technical view of the same flow; **6** and **7** describe the data behind them; **8** places the containers from **4** onto infrastructure.

---

## 1. System context (`CTX`)

- **Use when:** kickoff, onboarding, explaining scope to non-technical people.
- **Must show:** our system as **one** box, every type of user, every external system it depends on, a verb-phrase label on each arrow.
- **Avoid:** internal services, databases, protocols.

## 2. Integration map (`INT`)

- **Use when:** several systems already run in production and connections are being added, changed or retired. Usually the main diagram on integration projects.
- **Must show:** each system once; each integration as an arrow with its `I-xx` ID, mechanism (REST, webhook, file over SFTP, events) and status tag (`DONE`, `PLANNED <when>`, `OPEN`, `RETIRING`; see house style, section 7); what replaces what.
- **Avoid:** internals of the systems. Keep one arrow per integration.

## 3. Business process (`PRC`)

- **Use when:** agreeing with stakeholders on who does what, the rules, and the failure paths.
- **Must show:** one swimlane per party (role, team or system), a clear start and end, every decision with labelled outcomes, the unhappy paths.
- **Avoid:** technology names, unless the stakeholders need them to decide.

## 4. Container (`CON`)

- **Use when:** developers need to understand or build one system.
- **Must show:** apps, services, data stores, queues and buses inside a named boundary; the technology of each (`Node.js · Lambda`); external systems outside the boundary; protocol on every arrow.
- **Avoid:** classes and modules (that is a component diagram: draw one only for a complex area).

## 5. Sequence (`SEQ`)

- **Use when:** one scenario crosses several systems and the order matters: API flows, auth, integration handshakes, retries.
- **Must show:** `autonumber`, sync calls `->>`, async messages `-)`, responses `-->>`, the moment state changes.
- **Avoid:** more than 8 participants. Split long scenarios.

## 6. State (`STA`)

- **Use when:** an entity (order, payment, subscription, claim) has a lifecycle and people disagree about the allowed transitions.
- **Must show:** every state, every allowed transition with its trigger, the end states.
- **Avoid:** mixing two entities in one diagram.

## 7. ER (`ERD`)

- **Use when:** designing or explaining a data model, or mapping fields between two systems.
- **Must show:** entities, key attributes with types, PK/FK, cardinality, a verb on each relationship.
- **Avoid:** listing every column. Show the ones that explain the relationships and the business rules.

## 8. Deployment (`DEP`)

- **Use when:** ops, security or compliance review; environment and network design.
- **Must show:** cloud account and region, network boundaries (VPC, subnets), where each container runs, managed services, connections to on-premises or other clouds.
- **Avoid:** detailed icons. This is a logical view. If a client needs an icon-level diagram, export from this one, but keep the `.mmd` as the source.

---

## Not in the catalog (on purpose)

- **Component diagrams:** only for a complex area inside one container. Use `flowchart TB` with the same rules.
- **Whiteboard sketches:** during workshops, draw a Draft in any type above. Do not keep sketches as a separate format.
- **Hand-drawn HTML pages:** never as the source (see `house-style.md`).
