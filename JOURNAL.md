# JOURNAL — MedCore

> Dated log of decisions, pivots, incidents, and quotes. Add entries as things happen — retrospectives need this raw material to land. Not a changelog (commit messages are that). Not a ticket tracker. Capture the *human* context that disappears within weeks.

**Tags:** `#decision` `#pivot` `#incident` `#quote` `#feedback` `#milestone`

> ℹ️ **Backfill notice.** Entries below dated 2026-04-18 and 2026-05-21 were reconstructed from git history and the published README in May 2026, AFTER the YAIS sprint. They cover the *what* and *when* that's verifiable from commits and docs — the *who said what* and *what surprised you* parts are mostly missing because the journal didn't exist during the sprint. Going forward, treat these as the structure, not the precedent: new entries should land in the moment with the human detail intact.

---

## 2026-05-23 — Started this journal `#milestone`

Picked up that future content (post-mortem posts, demo scripts, eventual O-1 evidence) was hitting a wall on "what broke" and "what someone said at the booth" because nothing got written down during the YAIS sprint. Backfilled the entries below from git + README; marked the gaps with `[FILL]` where only personal memory can answer.

---

## 2026-05-21 — Public-facing polish round `#milestone`

Single-day push that took MedCore from "won a thing at Yale" to "is a real repo on the internet." Notable commits in this batch:

- `5f305f5` — Full EHR domain on the backend: appointments, labs, vaccinations, referrals, encounters, inventory, staff, consent, audit. FHIR mappers. AI assist layer.
- `a4491ba` — Web wired to the live endpoints (previously mocked client-side).
- `693218d` — Dockerized, LICENSE, CONTRIBUTING, CI workflow.
- `0968a10` — README rebuilt to standard baseline: banner (light + dark SVG → PNG), shields.io badges, Mermaid user-flow diagram, embedded demo GIF, license section.
- `c2c9006` — Auto-CD via `gcloud reset` + reboot-safe startup script. Live deploy at `136-117-181-143.nip.io`.
- `18245e5` — Gherkin BDD e2e suites (QA + demo) with video reporter.

This was the "make it credible as a real project" round — distinct from the YAIS sprint, which produced a working demo but not a public repo.

> `[FILL]` What prompted this round? Was there a specific conversation post-YAIS that made you decide to harden it instead of moving on? Investor interest? A pilot conversation? Just engineering discipline kicking in?

---

## 2026-04-18 — Won YAIS IV (Technology & AI Innovation Lab) `#milestone`

Yale Africa Innovation Symposium IV. We took the Technology & AI Innovation Lab award. Photos in `assets/yais-iv-team-presenting.jpeg` and `assets/yais-iv-tech-ai-lab.jpeg`.

> `[FILL]` What was the moment you found out you'd won? Where were you standing? Who told you? What did the room sound like?
>
> `[FILL]` Anything the judges said in their announcement or feedback that's worth keeping verbatim?
>
> `[FILL]` One specific demo-floor conversation from earlier in the day — the one you'd bring up at dinner. (Without this, the YAIS retrospective falls back to generic "the room loved it" narration.)

---

## 2026-04-18 — Demo sprint culminates `#milestone`

Same day, before the judging. Late commits land the things that mattered for the live demo:

- `e83092a` — Patient chart URL encoded in QR code (Health ID).
- `c39b2dd` — Full-screen mobile consult UI for video.
- `e8ed8a3` — Deterministic Jitsi room per patient (Daily.co fallback).
- `aee4b8f` — Softer SMS command parse-error UX.
- `77cd949` — Public QR origin + login return preserves query string.

The pattern is the same: each fix is a thing someone would have hit at the booth if it had been broken. The fixes shipped *that day*. The demo ran.

> `[FILL]` Specific edge case anyone discovered during the booth demo that hadn't surfaced in testing? (This is the highest-value journal entry you can write retroactively if you can remember any.)

---

## 2026-04-18 — Mobile-first refactor mid-sprint `#decision`

Three commits within the YAIS-day sprint pivoted the UI:

- `8484545` — Mobile-first shell with bottom nav + drawer.
- `690f20c` — `ResponsiveTable` component; converted 7 pages to card-stack on mobile.
- `41cb6a8` — Mobile-friendly modals, charts, and heatmap.

The implication: at some point during the day someone realized the demo would land on phones more often than laptops and the desktop-first layout would feel clunky. The seven-page card-stack conversion is substantial work to ship in a single sprint — this wasn't a small refinement, it was a directional bet.

> `[FILL]` Was this triggered by a specific moment? Watching someone struggle to view the dashboard on a phone? Or a deliberate up-front decision that the demo would be phone-first?

---

## 2026-04-18 — JWT session cookie auth shipped `#decision`

Commits `50b843d` (server) + `693a620` (web). The auth model: HTTP-only cookie after PIN-based login, `requireApiSession` middleware on protected routes, demo PINs configurable via `server/.env`. Session secret enforced ≥32 chars in production.

The non-obvious call: PINs for demo accounts (`DOC-001 / 4242`, etc.) — a tradeoff between "feels like real auth" and "judges shouldn't have to wait for a password reset email." PINs let the demo flow cleanly while still showing the session middleware exists.

> `[FILL]` Was real password / OAuth auth considered and rejected, or was PINs the obvious choice from the start?

---

## 2026-04-18 — Mock-everything discipline `#decision`

Not in a single commit — visible across `server/src/routes/*` and `server/src/lib/*`. Every external integration (OpenRouter, Whisper, Daily.co, Africa's Talking, OpenFDA) ships with a deterministic mock that activates when the API key is absent. Documented in the README "Environment variables" table.

This is the architectural decision the YAIS retrospective leans on: the discipline that the demo runs offline. Every fallback path was a deliberate write — none of them are accidents.

> `[FILL]` Was this a decision that landed early in the sprint or accumulated as integrations were added? Was there a moment where someone proposed "let's just require the keys for now" and got pushed back? (If so, the pushback story is worth keeping verbatim.)

---

## 2026-04-18 — Rebranded AfyaLink → MedCore `#pivot`

Commit `0d1251f`. Project started as "AfyaLink" — visible in commits `b467cb3` (initial UI) and earlier. Renamed mid-sprint to MedCore.

> `[FILL]` Why the rename? Domain availability? Trademark concern? Just preferred MedCore on reflection?

---

## 2026-04-18 — Codebase scaffolded `#milestone`

Commits `2f66904` + `b467cb3`. Vite 6 + React + Tailwind. First UI shell. The journal starts here as far as git is concerned; whatever happened before this (deck, pitch prep, team formation) didn't get committed.

> `[FILL]` When did the team form? How did it form? When was the YAIS application submitted, and on what timeline? (Pre-history that's worth preserving even if it's not in git.)

---

## How to use this file going forward

When something happens during active MedCore work — a user-facing decision, a pivot, a memorable conversation, a bug that taught something — add an entry here in the moment. One paragraph max. Use the tags. Date stamps in `YYYY-MM-DD`.

Don't worry about polish. The point is the raw material; the polished retrospective comes later. A one-sentence note from today beats a missing paragraph from six months ago.
