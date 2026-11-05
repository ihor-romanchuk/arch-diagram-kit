# Project: BrewBox (worked example)

A fictional online coffee subscription shop on AWS, used to show how the kit works. The diagrams in `diagrams/` are drawn from the registries below.

## Basics

| | |
|---|---|
| Client | BrewBox (fictional) |
| My role | Solutions architect |
| Claude account | Personal |
| Diagram source folder | `examples/brewbox/diagrams/` |
| Published to | GitHub README |
| Cloud | AWS, eu-central-1 (Frankfurt), separate prod account |
| Main languages | Node.js (services), Next.js (web), React Native (mobile) |

## People and approvals

| Role | Name | Approves |
|---|---|---|
| Business owner | Head of E-commerce | CTX, PRC |
| Tech lead | Lead engineer | CON, SEQ, STA, ERD |
| Platform / security | Platform engineer | DEP |
| Integration owner | Solutions architect | INT |

## Systems registry

| ID | Name (exact) | Class | Owner | Technology | Status | Also called |
|---|---|---|---|---|---|---|
| S-01 | BrewBox Platform | internal | E-commerce team | AWS, Node.js | live | the shop, the platform |
| S-02 | Web shop | internal | E-commerce team | Next.js on Amplify Hosting | live | website |
| S-03 | Mobile app | internal | E-commerce team | React Native | live | app |
| S-04 | Order Service | internal | E-commerce team | Node.js · ECS Fargate | live | OMS, orders |
| S-05 | Subscription Service | internal | E-commerce team | Node.js · Lambda | live | subs |
| S-06 | Fulfilment Worker | internal | E-commerce team | Node.js · Lambda | live | |
| S-07 | Stripe | external | Stripe | SaaS | live | payments, PSP |
| S-08 | SAP ERP | external | Finance IT | SAP, on-premises | live | ERP, finance |
| S-09 | 3PL Warehouse | external | Logistics partner | SFTP | live | warehouse, WMS |
| S-10 | HubSpot CRM | external | Marketing | SaaS | planned | CRM |
| S-11 | Customer | person | | | | user |
| S-12 | Support agent | person | Customer care | | | support, CS |

## Integrations registry

| ID | From | To | Purpose | Mechanism | Sync / async | Status | Replaces |
|---|---|---|---|---|---|---|---|
| I-01 | BrewBox Platform | Stripe | Take card payments | REST | sync | live | |
| I-02 | Stripe | BrewBox Platform | Payment results | Webhook into API Gateway | async | live | |
| I-03 | BrewBox Platform | SAP ERP | Sales for invoicing | Nightly CSV, S3 + Transfer Family SFTP | async | live | |
| I-04 | BrewBox Platform | SAP ERP | Sales for invoicing, real time | EventBridge events | async | planned Q1 | I-03 |
| I-05 | BrewBox Platform | 3PL Warehouse | Orders to ship | Transfer Family SFTP, every 15 min | async | live | |
| I-06 | BrewBox Platform | HubSpot CRM | Customer and order events | EventBridge API destination | async | planned Q2 | |

## Glossary

| Term | Meaning |
|---|---|
| Renewal | The monthly order created automatically for an active subscription |
| 3-D Secure | The bank's extra confirmation step during card payment |

## Diagram index

| ID | File | Type | Audience | Status | Last verified |
|---|---|---|---|---|---|
| CTX-01 | `context--brewbox.mmd` | System context | Business | Approved | 2026-11-04 |
| INT-01 | `integration--brewbox.mmd` | Integration map | Business + tech | In review | 2026-11-04 |
| PRC-01 | `process--brewbox--renewal.mmd` | Business process | Business | Approved | 2026-11-04 |
| CON-01 | `container--brewbox.mmd` | Container | Tech | Approved | 2026-11-04 |
| SEQ-01 | `sequence--brewbox--checkout-3ds.mmd` | Sequence | Tech | Approved | 2026-11-04 |
| STA-01 | `state--brewbox--order.mmd` | State | Tech | Approved | 2026-11-04 |
| ERD-01 | `erd--brewbox.mmd` | ER | Tech | Draft | 2026-11-04 |
| DEP-01 | `deployment--brewbox--prod.mmd` | Deployment | Tech | Draft | 2026-11-04 |

## Decisions from diagram sessions

| Date | Decision | Diagram | Agreed by |
|---|---|---|---|
| 2026-11-04 | Replace the nightly SAP CSV (I-03) with EventBridge events (I-04) in Q1 | INT-01 | Business owner, Finance IT |
