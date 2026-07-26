# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

`julien-os` is a working copy of **AIS-OS**, an MIT-licensed Claude Code starter kit (originally a separate clone, flattened into this repo — see commit `bbed943`) that turns Claude Code into a personal "AI Operating System" (AIOS): persistent context about the user's business, live connections to their tools, a small set of reusable skills, and recurring rituals that build automation leverage over time.

All kit content lives under `AIS-OS/`. There is no application source code, build system, package manager, or test runner — this is a markdown + Claude Code skill-definition project. "Development" here means editing these markdown files and `SKILL.md` instructions directly; there is nothing to compile, lint, or run.

**Important working-directory note:** the kit's skills (`.claude/skills/`) live under `AIS-OS/.claude/skills/`, and every skill reads paths relative to that folder (`aios-intake.md`, `connections.md`, `context/`, `decisions/log.md`, `references/`). To actually invoke `/onboard`, `/audit`, or `/level-up`, Claude Code needs `AIS-OS/` as its project root (i.e. open/cd into `AIS-OS/`), not the repo root.

**Current state:** the kit has not been onboarded yet — `AIS-OS/aios-intake.md` still has unfilled `[Your answer here]` placeholders, `AIS-OS/context/` only contains a `.gitkeep`, and `AIS-OS/connections.md` rows all say "not yet connected". `AIS-OS/CLAUDE.md` (the generated operating manual) still has unfilled `{{...}}` tokens. Running `/onboard` is the natural next step before any of the other skills produce non-trivial output.

## Architecture: the Four Cs

The kit's design rolls up to one litmus test: *while the user is away, the AIOS observes a real-world event and produces an output faster/more accurate than the user would themselves.* Four layers, built in this dependency order:

1. **Context** (non-skippable) — knows the business: `AIS-OS/context/`, `AIS-OS/CLAUDE.md`, `references/voice.md`, `decisions/log.md`.
2. **Connections** (parallel with Capabilities) — reaches the user's tools: `AIS-OS/connections.md` registry, mechanism-agnostic (MCP / script / export pipeline / API key + reference doc).
3. **Capabilities** (parallel with Connections) — knows how to do the work: skills in `.claude/skills/`, agents in `.claude/agents/`.
4. **Cadence** (last — don't automate a workflow that doesn't work manually yet) — runs unprompted: scheduled hooks, recurring skill rituals.

The companion framework for *how the user should think* about automation (not what to build) is **The Three Ms** — Mindset → Method → Machine — in `AIS-OS/references/3ms-framework.md`. Both "Three Ms of AI™" and "Four Cs of an AIOS™" are trademarks of Nate Herk; the content is MIT-licensed but the trademark names are reserved (see `AIS-OS/LICENSE`). Preserve the attribution lines whenever this content is copied, quoted, or extended.

## The three shipped skills and how they compose

| Skill | Cadence | Role |
|---|---|---|
| `/onboard` | Once (Day 1), idempotent re-run any time | Reads/writes `aios-intake.md` (7-question intake, hard cap — never add an 8th question), then scaffolds `context/*.md`, `references/voice.md`, `connections.md`, and fills `CLAUDE.md`'s `{{...}}` placeholders. Backs up prior versions to `archives/intake-{timestamp}/` on re-run. |
| `/audit` | Weekly, read-only | Structural Four-Cs scoreboard (25 pts each). Answers "is the AIOS built right?" Only writable side effect: optionally saves the report to `audits/audit-{date}.md`. |
| `/level-up` | Weekly (Friday ritual), first run Day 14 | Functional gap-finder: Mindset interview (find a candidate) → Method interview (EAD: Eliminate/Automate/Delegate, map the process, pick an autonomy level L0–L4, tie to a KPI) → Machine handoff (scaffold one artifact). One run produces exactly one shipped artifact plus one dated entry in `decisions/log.md`. |

`/audit` and `/level-up` are deliberately different axes (form vs. function) and are meant to run in series — fix structure, then plan capability.

## Key files and their role

- **`AIS-OS/CLAUDE.md`** — the *generated* operating manual for the finished AIOS persona, not a duplicate of this file. It contains `{{...}}` placeholders filled by `/onboard` Step 3 (name, stated priority, voice register, connections summary). Don't hand-edit the placeholder tokens outside of `/onboard`'s flow — `aios-intake.md` is the single source of truth it's regenerated from.
- **`AIS-OS/aios-intake.md`** — canonical 7-question intake. Edit answers here and re-run `/onboard` to refresh downstream files.
- **`AIS-OS/connections.md`** — registry of the 7 Tier-1 data domains (Revenue/Financials, Customer interactions, Calendar, Communication, Project/task tracking, Meeting intelligence, Knowledge/files) and how each is reached (`mcp` / `script` / `export` / `key+ref` / `not yet connected`).
- **`AIS-OS/decisions/log.md`** — append-only decision record. `/level-up` Phase 2 writes scoped automation specs here; append manually for any other meaningful decision.
- **`AIS-OS/references/3ms-framework.md`** — the operator-brain framework `/level-up` walks the user through. Shipped, read-only content — don't overwrite.
- **`AIS-OS/EXPANSIONS.md`** — what to add as usage grows (`projects/`, `templates/`, `scripts/`, `.claude/agents/`, sub-OS folders) and explicit anti-patterns to avoid re-introducing.

## Conventions to preserve when editing this kit

- **Flat over nested.** Don't pre-create folders before they're needed — `context/` and `archives/` currently hold only `.gitkeep` because nothing has been generated yet. `EXPANSIONS.md` has the two-question test ("conceptually new?" + "touched 3+ times this month?") for when a new top-level folder is actually justified.
- **One root operating manual.** Per `EXPANSIONS.md`: a sub-OS folder may get its own scoped `CLAUDE.md`, but there is exactly one canonical root manual — don't fork it.
- **No graveyard folders.** No `notes/`, `misc/`, `tmp/`, or `inbox/` — old material moves to `archives/`, new material gets a real file in the right place.
- **No parallel decision logs.** `decisions/log.md` is the only one; don't add a second `decisions.md`.
- **Boring is beautiful.** Skills default new automation to the lowest autonomy level (L0 manual → L4 autonomous) and the least AI needed to solve the problem — "workflows beat agents." Respect this default if adding or modifying skills; push back on jumping straight to full autonomy.
- **Kit is intentionally lean.** It ships exactly 3 skills; new skills are meant to be authored by the user via `/level-up`, not added speculatively to the base kit.
