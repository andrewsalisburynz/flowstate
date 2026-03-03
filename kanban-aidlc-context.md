# AI-Driven Kanban Board — Project Context and Ways of Working

> This document captures the product vision, architectural thinking, and delivery approach for the AI-driven Kanban board project. It is intended as a Kiro steering file — providing the context needed to make coherent, consistent decisions across all construction bolts without re-litigating decisions already made.

---

## 1. Product Vision

This is a cloud-hosted Kanban board built as a SaaS product. The core design philosophy is to move the Kanban board from a **system of record** to a **system of action**. The board should proactively surface insight and reduce cognitive overhead for the team, not just track what humans manually enter.

This framing should inform every feature decision. When evaluating whether something belongs in the product, the question is: does this help the team act, or does it just help them record?

### AI Features — Phase 1
- **Intelligent Task Management** — users describe work in natural language; AI structures it into a card with title, description, acceptance criteria, story point estimate, suggested assignee, and priority
- **Proactive Bottleneck Detection** — AI continuously analyses the board and surfaces risks, aging cards, workload imbalance, and patterns the team hasn't noticed, before they become problems

### Why These Two Features Together
Task creation reduces the friction of getting work onto the board. Bottleneck detection makes the board actively useful once work is on it. Together they address both ends of the workflow — input quality and flow health.

---

## 2. Architecture Philosophy

The architecture is fully serverless and AWS-native. This is a deliberate choice, not a default. The reasons are:

- **Data residency and compliance** — using AWS Bedrock means AI processing stays within AWS, which matters for enterprise SaaS customers asking about data privacy
- **Operational simplicity** — no servers to manage means a small team can run a production-grade product
- **Cost model** — serverless scales to zero, which is appropriate for a SaaS product in early growth where tenant volume is unpredictable
- **Coherence** — using native AWS services means less integration surface, fewer credentials to manage, and a single operational plane

Every architectural decision should be evaluated against these principles. If a non-AWS service is introduced, there should be a clear reason why the native equivalent is insufficient.

---

## 3. AWS Services and Their Roles

| Service | Role | Why |
|---|---|---|
| React (S3 + CloudFront) | Frontend | Standard SPA hosting; CloudFront provides global edge delivery |
| API Gateway REST | User-initiated operations | Synchronous request/response maps cleanly to deliberate user actions |
| API Gateway WebSocket | Server-pushed events and AI responses | Enables real-time multi-user sync and async AI result delivery without polling |
| Lambda | All compute | Serverless, scales automatically, fits bounded-responsibility function design |
| DynamoDB | Primary database | Serverless, scales with demand, native Streams support for event-driven patterns |
| DynamoDB Streams | Event-driven triggers | Card changes trigger lightweight analysis without polling |
| Bedrock (Claude) | AI layer | AWS-native, data stays in AWS, no third-party API key management |
| EventBridge | Scheduled jobs | Triggers periodic full board analysis and other scheduled operations |
| CloudWatch | Observability | Logs, metrics, dashboards, alarms — unified operational view for a serverless stack |
| Kinesis | User behaviour tracking | Streams product analytics events for usage pattern analysis |
| AWS AppConfig | Feature flags | Gates incomplete features in production during active bolt delivery |
| AWS CDK | Infrastructure as code | All infrastructure is provisioned as code — a first-class deliverable, not a manual step |
| Parameter Store | Prompt template storage | AI prompt templates stored and versioned independently from application code |

### Why Both REST and WebSocket

REST handles everything a user deliberately initiates — creating, moving, and editing cards. The response goes back to the requesting user only. This is the right transport for synchronous, user-initiated operations.

WebSocket handles everything the server needs to push proactively — AI task creation results (which are asynchronous and latency-sensitive), bottleneck alerts (generated in the background), and multi-user board state synchronisation (other users' card moves must appear on your board without a refresh). Without WebSocket, multi-user sync requires polling, which is inefficient, introduces latency, and creates unnecessary load.

### Why Two AI Analysis Modes

Bottleneck detection runs in two modes. A scheduled full-board analysis is thorough and can afford to be slow — it runs periodically via EventBridge and analyses the entire board against historical patterns. An event-driven scoped analysis is triggered by card moves and analyses only the affected column and assignee — fast, lightweight, and near real-time. Together they provide both depth and responsiveness without the cost of a full board analysis on every card move.

### AI Suggestions and Human Oversight

AI-generated card suggestions are returned to the user for confirmation before anything is persisted. This is a deliberate design decision — human oversight is preserved at every step, and it allows prompt quality to be iterated without any consequence to stored data.

---

## 4. AI Prompt Design Principles

The quality of AI behaviour in this product is determined almost entirely by prompt design, not by code. Prompts should be treated as production artifacts with the same discipline applied to code.

- Prompts are versioned and stored in Parameter Store — never hardcoded in Lambda functions. This allows prompt improvement without a code deployment
- All prompts instruct the model to return structured JSON — this makes downstream processing reliable and consistent
- Temperature should be kept low — consistency and predictability are more valuable than creative variation in a task management context
- Prompts always include dynamic context alongside the user's raw input — current board state, team members, historical patterns. The richer the context, the more coherent the output
- Bottleneck detection prompts explicitly instruct the model to return an empty result if nothing is worth surfacing — without this instruction the model will flag something even when the board is healthy, which rapidly erodes user trust in alerts

### Context Assembly as a Security Boundary

In a multi-tenant product, prompt context must be assembled strictly from the requesting tenant's data. A cross-tenant data leak in a prompt is a data breach, not a bug. Every Lambda that calls Bedrock must treat context assembly as a security operation, not a convenience step.

---

## 5. Multi-Tenancy Design Thinking

The product must be designed for multi-tenancy from day one, even if it launches serving a single tenant. Retrofitting multi-tenancy is significantly more expensive than building the foundations correctly.

### Isolation Model

The starting point is a **pool model** — shared infrastructure with every record scoped to a tenant. This is cost-appropriate for early-stage SaaS. The architecture should preserve the upgrade path to a **bridge model**, where high-value or compliance-sensitive enterprise customers can be moved to dedicated resources as an operational decision rather than an engineering project.

### Non-Negotiable Foundations

- Every database record carries a tenant identifier from the moment it is created
- Every Lambda operation scopes all data access to the requesting tenant — no exceptions
- WebSocket broadcasts are scoped to tenant and board — never cross-tenant
- Tenant context flows through every operation, extracted from the authentication token

### Tiering and Feature Gating

Multi-tenancy also enables a tiering model. Premium features — such as bottleneck detection — can be gated by tenant tier, checked by Lambda at invocation time. This should be designed in from the start even if all tenants begin on the same tier.

---

## 6. Observability and Operations

Operational tooling is a first-class deliverable, provisioned by CDK alongside the application. It is not a retrofit after launch.

### What to Instrument

The product needs three distinct layers of visibility. System health — Lambda error rates, API Gateway failure rates, database throttling — tells you whether the system is working. Usage patterns — cards created, AI suggestions accepted or rejected, alerts dismissed or acted on — tell you whether the product is delivering value. Cost attribution — Bedrock token consumption, Lambda invocations, database operations — tells you whether the unit economics are sound.

### Structured Logging

Every Lambda log entry must be structured and must include tenant context. When something goes wrong, structured logs scoped to a tenant identifier are the difference between diagnosing a problem in minutes and spending hours correlating unrelated entries.

### AI Feature Validation via Usage Data

The acceptance rate of AI suggestions is a leading indicator of prompt quality. If users are consistently rejecting AI-generated card structures, the prompts need tuning. If bottleneck alerts are being dismissed without action, either the detection is too noisy or the alert experience is not compelling. Neither can be known without tracking it. Usage data is not optional for an AI-driven product — it is the feedback loop that makes the AI useful over time.

### Cost Attribution Per Tenant

Bedrock costs scale with token consumption, and token consumption scales with context size. In a multi-tenant product, a single high-usage tenant can significantly distort overall costs. Tagging resources with tenant identifiers and emitting per-tenant consumption metrics enables cost-per-tenant analysis, which directly informs pricing model decisions.

---

## 7. Ways of Working — AI-DLC

### What AI-DLC Is

AI-DLC (AI-Driven Development Lifecycle) positions AI as a central collaborator in the development process, not a peripheral assistant. It operates in three phases — Inception, Construction, and Operations — with each phase feeding richer context into the next.

The core operating pattern is: AI creates a plan, seeks clarification, and implements only after human validation. This repeats rapidly for every activity. Humans make critical decisions; AI executes against them.

Traditional sprints are replaced by **bolts** — shorter, more intense work cycles measured in hours or days. The vocabulary reflects the methodology's emphasis on speed and continuous delivery.

### This Document as Inception Output

The architectural thinking, service decisions, prompt design principles, and ways of working captured here represent the Inception phase output for this project. This context should be fed into Kiro at the start of every construction bolt so that AI is always working from the decisions already made, not re-deriving them.

### Mob Working

AI-DLC construction happens in mob sessions — the whole team working together in real time with AI, not individuals working in isolation. AI proposes; humans clarify and validate. Critical decisions are always made by humans. The mob facilitator keeps bolt scope tight and prevents expansion mid-bolt.

### Five-Person Team Structure

| Role | Primary Responsibility |
|---|---|
| **Product Owner / Mob Facilitator** | Drives inception, owns bolt scope, feeds and maintains this context document, validates AI proposals against business intent |
| **Backend Construction Lead** | Leads Lambda and infrastructure generation bolts, owns service integration and data model decisions |
| **Frontend Construction Lead** | Leads React generation bolts, owns component library structure and frontend architecture |
| **Infrastructure and Operations Lead** | Owns CDK stack, deployment pipeline, and monitoring — ensures operational tooling ships alongside application code |
| **Quality and Context Guardian** | Owns test strategy, validates AI-generated tests, maintains repository context artifacts, acts as the adversarial voice in mob sessions |

---

## 8. Continuous Delivery and Trunk Based Development

Trunk based development and AI-DLC bolts are compatible but require deliberate discipline. Without it, bolts become big-bang merges, which undermines both approaches.

### The Core Discipline

A bolt is the unit of intent, not the unit of code delivery. Code is committed to trunk continuously throughout a bolt — every Lambda function that passes its tests goes in, every CDK construct that is validated goes in. The mob facilitator owns this discipline and must resist the temptation to accumulate generated code and push it all at the end of the bolt.

### Feature Flags as the Safety Mechanism

When a bolt builds something that spans multiple components — Lambda functions, a schema change, and frontend components — none of those pieces may be independently deployable. Feature flags via AWS AppConfig resolve this. Code goes to trunk continuously, behind a flag that is off in production until the full feature is coherent. This preserves continuous delivery while accommodating the reality that AI-generated features often span interconnected components.

### Short-Lived Bolt Branches

If the team is not comfortable committing AI-generated code directly to trunk mid-bolt, a short-lived bolt branch is an acceptable middle ground. The rule is that the branch must be merged to trunk within the duration of the bolt — never carried over. This preserves code review as a human oversight checkpoint and aligns with AI-DLC's principle of human validation of AI output.

### Pipeline Velocity

The CD pipeline must be fast enough to keep pace with bolt velocity. A slow pipeline becomes a bottleneck when a mob is generating and validating code throughout a working day. Pipeline speed is an engineering concern, not an operations concern, and should be treated as such from the start.

### Schema Change Discipline

Database schema changes must be additive only — expand/contract pattern. No breaking changes to existing access patterns until the old pattern is fully retired. AI-generated data model changes must be explicitly validated against this constraint by the mob before acceptance.

### Repository Context as a First-Class Artifact

AI-DLC introduces context artifacts — requirements, architecture decisions, prompt templates — that are not code but are just as critical. These live in the repository, are versioned, and follow the same trunk-based flow as code. A corrupted or outdated context artifact is the AI-DLC equivalent of a bad merge — future bolts built on stale context will drift from the intended architecture.

---

## 9. The Role of Testing

A separate testing team is an anti-pattern in a modern AI-DLC delivery context. It creates a quality gate that slows delivery and separates quality thinking from construction thinking — the two things that most need to be together.

### The Target Model

Quality engineering expertise belongs embedded in the delivery team. In an AI-DLC mob, quality engineers own test strategy, define acceptance criteria during inception, and validate AI-generated test suites during construction. They think adversarially about the system being built, which is exactly what a construction mob needs. This is a more senior and more impactful role than manual test execution.

### How AI Changes Testing

AI-DLC generates test suites alongside code. The quality engineer's job shifts from writing tests to defining the testing strategy the AI executes against, and validating that generated tests actually reflect the right behaviour — not just that they pass.

### Managing the Transition

The separate testing team should not be positioned as a problem to be eliminated. The framing is that their skills are valuable and the goal is to expand their impact by moving them closer to where decisions are made. Engineers who engage with this framing become advocates for the change. The transition should be paced to the slowest legitimate concern, not the fastest enthusiast.

---

## 10. The Role of Design

Traditional design process — wireframes, mockups, prototype, review, handoff — is incompatible with bolt velocity. By the time a designer produces a high-fidelity mockup, the bolt that builds the feature may already be complete. The answer is not to remove design thinking; it is to move it upstream and encode it in a form that AI tooling can consume.

### Design Intent Encoded in the Repository

The React component library and design token system are the mechanism by which design intent is applied consistently across all generated code — without a designer needing to be present in every bolt session. When the component library is the design, there is no translation step to leak through. Design consistency becomes a structural property of the build, not a review gate.

### What Designers Own

- **The component library** — React primitives that construction bolts assemble from rather than invent
- **Design principles as documented rules** — explicit, repository-resident guidance covering interaction patterns, error state behaviour, hierarchy rules, and so on — written so that AI can apply them consistently
- **Experience review** — reviewing bolt outputs at the flow and coherence level, not the component level

### Design Spikes for Novel Interactions

When a bolt introduces a genuinely new interaction pattern not covered by the existing component library, a short design spike at the start of the bolt defines the pattern before code generation begins. The output is a new component added to the library — an investment in the design system, not a one-off artefact.

### Why This Model Is Better for the Designer

In the traditional handoff model, designers are peripheral to construction. In this model, designers are the authors of the system that shapes all AI output. That is a more strategic and more durable form of influence. Design quality scales with the team rather than being bottlenecked on designer availability.

---

## 11. Managing the Introduction of AI-DLC

The engineering team may carry legitimate skepticism about AI tooling based on past poor experiences — hallucinated code, tools that slowed people down while claiming to speed them up. That skepticism deserves respect, not dismissal.

### Approach

- **Listen before evangelising** — first conversations should be diagnostic. Understand where the pain is and what specific experiences are driving the skepticism before proposing solutions
- **Demonstrate, don't mandate** — introduce AI-DLC through a single, self-contained bolt with willing participants. Make the experiment visible and honest about what worked and what didn't. Engineers respond to empirical evidence, not promises
- **Pace to the slowest legitimate concern** — after a successful initial bolt, resist rolling out broadly before the culture has caught up. People who weren't part of the early experiment will feel steamrolled if change moves faster than their trust
- **Keep the conversation about outcomes** — the discussion should always centre on delivery velocity, quality, and developer experience. If it becomes a debate about whether AI is good or bad, refocus on the outcomes

### The Risk of Moving Too Fast

The most common failure mode is a successful early bolt followed by premature broad rollout. This hardens resistance in people who were not part of the early experience. Pace matters more than speed.

---

## 12. Key Decisions and Rationale

| Decision | Rationale |
|---|---|
| System of action, not system of record | Frames every feature decision around user value, not feature completeness |
| Fully serverless AWS-native stack | Operational simplicity, cost model appropriate for SaaS growth, data residency for enterprise compliance |
| Bedrock for AI | Data stays in AWS; no third-party API key management; native integration with the rest of the stack |
| REST + WebSocket | REST cannot push to clients; WebSocket is required for multi-user sync and async AI responses |
| Two bottleneck analysis modes | Scheduled for depth, event-driven for near-real-time — avoids full board analysis cost on every card move |
| AI suggestions confirmed before persistence | Human oversight at every step; allows prompt iteration without data consequences |
| Prompt templates in Parameter Store | Prompt improvement without code deployment; prompts treated as production artifacts |
| Multi-tenancy foundations from day one | Retrofitting is significantly more expensive than building correct foundations early |
| Pool model with bridge upgrade path | Cost-appropriate for early scale; enterprise migration path preserved without a future engineering project |
| Design system as repository artifact | Encodes design intent in a form AI tooling can consume; removes design handoff as a delivery bottleneck |
| Trunk based delivery within bolts | Prevents bolt-as-big-bang-merge; preserves continuous delivery discipline at AI generation velocity |
| Quality embedded in mob, not separate gate | Quality thinking belongs at the point of construction, not after it |
| CDK provisions observability alongside application | Operational tooling is a first-class deliverable, not a retrofit |
| Usage tracking for AI feature validation | Prompt quality cannot be improved without data on how users respond to AI suggestions |
