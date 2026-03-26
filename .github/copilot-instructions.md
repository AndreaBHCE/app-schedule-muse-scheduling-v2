# Copilot Engineering Standards — ScheduleMuse AI

## Core Mandate
99.99th percentile engineering. Absolute ceiling intelligence, zero knowledge gaps, maximum analytical rigor. First-principles on every decision — no assumptions, no consensus-driven defaults. Build it right the first time. No bandaids, no silent fallbacks, no quick-and-dirty.

## Deletion Priority
Question every requirement before implementing it. Before writing a line of code, ask: does this feature need to exist? Does this endpoint need to exist? Does this abstraction layer add value or just indirection? Does this fallback provide real safety or hide a configuration failure? If the answer is not clearly yes, delete it. Prefer deleting complexity over managing it. Prefer a loud failure over a silent default.

## Single Source of Truth
No value hardcoded in more than one file. URLs, domains, secrets, config — one canonical location, referenced everywhere. Duplication is a bug. Refactor before extending.

## Fail Fast
Missing env var? Throw at request time with a clear message. Never fall back to a hardcoded default. A crash with a good error is better than silent wrong behavior.

## Critical-Path Analysis
Every implementation decision must be evaluated against the critical path to the end-state. Identify the dependency chain: what does this block, what depends on this, what does this make harder to change later? If a decision sits on the critical path, it gets maximum rigor. If it doesn't, it gets minimum complexity. Mandatory risk assessment on every architectural choice — not speculative, but structural: does this create a dependency that constrains future options?

## End-State Reverse Engineering
Reverse-engineer from the 8-year end-state in the background. ScheduleMuse AI at full scale: multi-tenant, high-concurrency, multi-provider integrations, enterprise customers. Every architectural decision made today must not close off paths to that end-state. Flag any Year 1–5 scaling risk only if it is a proven structural risk, not speculative. When flagged, build the scalable version now. Do not build the simple version with a plan to fix it later.

## Edit Verification
After every string-level edit, automatically grep to confirm: all intended instances changed, no unintended mutations, zero instances of old pattern remain. No exceptions. Do not wait to be asked.

## Execution Discipline
- Execute the full task in one pass. Do not stop to ask permission between steps unless a hard blocker exists (missing credential, ambiguous destructive action, irreversible architectural fork).
- Questions must be specific, actionable, and copy-paste-executable. No soft or exploratory questions.
- If uncertain, state **UNVERIFIED**. Do not present guesses as facts.

## Output Discipline
- Maximize token economy. Cap non-essential content at 10% of response.
- Never repeat information already established. Never summarize completed work unless asked.
- Never announce tool usage. Never data-dump.

## Pre-Commit Audit
Before any commit: (1) every requested change implemented, (2) no unrequested changes, (3) no duplicated hardcoded values, (4) error paths fail loudly, (5) zero compile/lint errors, (6) grep confirms no residual old patterns.

## Project Context
ScheduleMuse AI — Next.js scheduling platform. Frontend hosted on Vercel. Backend database on Cloudflare D1 (no Workers — Vercel conflict). Subscriber platform: app.schedulemuseai.com. Marketing platform: schedulemuseai.com.
