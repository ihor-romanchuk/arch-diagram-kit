# Project: <name>

Copy this file into each project, usually at `docs/architecture/PROJECT.md`. Claude reads it before drawing or changing any diagram, so keep the registries current.

## Basics

| | |
|---|---|
| Client | |
| My role | |
| Start date | |
| Claude account | Personal / Enterprise (<org>) |
| Diagram source folder | `docs/architecture/diagrams/` in <repo> |
| Published to | Confluence space / Notion page / Azure DevOps wiki / GitHub README |
| Issue tracker | Jira / Linear / Azure Boards / GitHub Issues |
| Cloud | AWS (accounts, main region) |
| Main languages | Node.js / ... |

## People and approvals

| Role | Name | Approves |
|---|---|---|
| Business owner | | CTX, PRC |
| Tech lead | | CON, SEQ, STA, ERD |
| Platform / security | | DEP |
| Integration owner | | INT |

## Systems registry

Every name on every diagram comes from this table. Add a system here **before** drawing it.

| ID | Name (exact) | Class | Owner | Technology | Status | Also called |
|---|---|---|---|---|---|---|
| S-01 | | internal / managed / external / person | | | live / planned / retiring | |

`Class` maps to the colour key in `house-style.md`. `Also called` lists names people use in meetings, so Claude can map them to the exact name.

## Integrations registry

| ID | From | To | Purpose | Mechanism | Sync / async | Status | Replaces |
|---|---|---|---|---|---|---|---|
| I-01 | | | | REST / webhook / events / file over SFTP | | live / planned <when> / retiring | |

## Glossary

| Term | Meaning |
|---|---|
| | |

## Diagram index

| ID | File | Type | Audience | Status | Last verified | Published at |
|---|---|---|---|---|---|---|
| CTX-01 | `context--<scope>.mmd` | System context | Business | Draft | | |

## Decisions from diagram sessions

Claude adds a row at the end of every live session.

| Date | Decision | Diagram | Agreed by |
|---|---|---|---|
| | | | |
