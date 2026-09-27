# MedCore accessibility evidence matrix

This matrix records the current accessibility audit scope for MedCore. It is an engineering release gate, not a claim that MedCore already conforms to WCAG 2.2 AAA. Manual evidence is `Not recorded` until a person completes the required review.

## Status vocabulary

Use only `Pass`, `Fail`, `Needs review`, or `N/A with rationale`. Every `Pass` needs evidence. Every `N/A with rationale` needs a reason. `Fail` and `Needs review` block the release gate.

## Route and state coverage

| Surface | State or role | Automated coverage | Manual status | Evidence |
| --- | --- | --- | --- | --- |
| `/` and role dashboards | Doctor, Patient, and Admin sessions; light/dark themes; 320/375/768/1440px | E2E and component suites | Needs review | Not recorded |
| `/login` and `/consent` | Anonymous session, validation error, bio-auth/PIN prompt, consent agreement | Auth flow tests | Needs review | Not recorded |
| `/patients` | Doctor and Admin sessions, search, filter by risk/condition, pagination | Directory and table tests | Needs review | Not recorded |
| `/patients/:id` | Patient clinical profile, vitals charts, FHIR timeline, tabbed records | Clinical timeline and responsive table tests | Needs review | Not recorded |
| `/appointments` | Doctor and Patient sessions, booking calendar, time-slot selection | Calendar and modal tests | Needs review | Not recorded |
| `/prescriptions` | Doctor session, `PrescriptionFormModal`, dosage validation, status chips | Form modal and table tests | Needs review | Not recorded |
| `/lab-results` and `/vaccinations` | Patient and Doctor views, report cards, status indicators, print/export | Diagnostic records tests | Needs review | Not recorded |
| `/voice-consult` and `/video-consult` | Active consultation, audio waveform/recorder, Daily.co telehealth iframe | Telehealth mock tests | Needs review | Not recorded |
| `/ai-assist` | Whisper transcription review, clinical summary cards, risk factor callouts | AI assistant panel tests | Needs review | Not recorded |
| `/health-id` | QR code generation, Health ID card presentation, offline verification | Health ID tests | Needs review | Not recorded |
| Global shell | Header, Sidebar, BottomNav (mobile), MobileDrawer, offline PWA banner, theme switcher | Mobile shell and navigation tests | Needs review | Not recorded |
| Localization & RTL | English, Swahili, Hausa, French, Arabic (RTL) | Translation catalog and layout tests | Needs review | Not recorded |

## WCAG 2.2 success criteria

Each applicable criterion has its own row so that evidence and dispositions cannot be hidden in grouped ranges.

| Criterion | Level | Surface or state | Method | Evidence | Status | Reviewer | Date | Rationale or issue |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1.1.1 Non-text Content | A | All routes, avatars, charts, QR codes | Axe and screen reader | Not recorded | Needs review | | | |
| 1.2.1 Audio-only and Video-only (Prerecorded) | A | Media consultation guides | Manual media review | Not recorded | Needs review | | | |
| 1.2.2 Captions (Prerecorded) | A | Video consultation instructions | Manual media review | Not recorded | Needs review | | | |
| 1.2.3 Audio Description or Media Alternative (Prerecorded) | A | Instruction videos | Manual media review | Not recorded | Needs review | | | |
| 1.2.4 Captions (Live) | AA | Telehealth video consults | Telehealth media review | Not recorded | N/A with rationale | | | Live consult captions rely on platform integration |
| 1.2.5 Audio Description (Prerecorded) | AA | Training media | Manual media review | Not recorded | Needs review | | | |
| 1.3.1 Info and Relationships | A | All tables, forms, and clinical timelines | Axe and accessibility tree | Not recorded | Needs review | | | |
| 1.3.2 Meaningful Sequence | A | Responsive dashboards and clinical charts | Keyboard and screen reader | Not recorded | Needs review | | | |
| 1.3.3 Sensory Characteristics | A | Triage alert colors and status instructions | Visual and content review | Not recorded | Needs review | | | |
| 1.3.4 Orientation | AA | Mobile and tablet PWA layouts | Viewport review | Not recorded | Needs review | | | |
| 1.3.5 Identify Input Purpose | AA | Auth and patient demographic inputs | Axe and accessibility tree | Not recorded | Needs review | | | |
| 1.3.6 Identify Purpose | AAA | Navigation icons and clinical actions | Accessibility tree and content review | Not recorded | Needs review | | | |
| 1.4.1 Use of Color | A | Clinical risk flags and appointment statuses | Visual review | Not recorded | Needs review | | | |
| 1.4.2 Audio Control | A | Telehealth audio and voice consult feedback | Audio control review | Not recorded | N/A with rationale | | | No auto-playing background audio present |
| 1.4.3 Contrast (Minimum) | AA | Light, dark, and African-themed tokens | Axe and visual review | Not recorded | Needs review | | | |
| 1.4.4 Resize Text | AA | 200% and 400% zoom on clinical records | Zoom and reflow review | Not recorded | Needs review | | | |
| 1.4.5 Images of Text | AA | Health ID cards and badge graphics | Visual review | Not recorded | Needs review | | | |
| 1.4.6 Contrast (Enhanced) | AAA | Clinical text and vital sign indicators | Axe and visual review | Not recorded | Needs review | | | |
| 1.4.10 Reflow | AA | 320px mobile viewport and drawer | Responsive review | Not recorded | Needs review | | | |
| 1.4.11 Non-text Contrast | AA | Focus rings, chart axes, inputs, buttons | Axe and visual review | Not recorded | Needs review | | | |
| 1.4.12 Text Spacing | AA | Clinical cards and prescription lists | Text-spacing review | Not recorded | Needs review | | | |
| 1.4.13 Content on Hover or Focus | AA | Tooltips and patient quick-action popovers | Keyboard and pointer review | Not recorded | Needs review | | | |
| 2.1.1 Keyboard | A | All clinical workflows and modal forms | Keyboard review | Not recorded | Needs review | | | |
| 2.1.2 No Keyboard Trap | A | Prescription modal, drawer, dialogs | Keyboard review | Not recorded | Needs review | | | |
| 2.1.4 Character Key Shortcuts | A | Clinical navigation shortcuts | Keyboard review | Not recorded | N/A with rationale | | | No single-character shortcuts active without modifier |
| 2.2.1 Timing Adjustable | A | Auth session timeouts and alerts | Timing review | Not recorded | Needs review | | | |
| 2.2.2 Pause, Stop, Hide | A | Vitals live monitors and sync tickers | Motion review | Not recorded | Needs review | | | |
| 2.3.1 Three Flashes or Below Threshold | A | Alert banners and consultation indicators | Motion review | Not recorded | Needs review | | | |
| 2.4.1 Bypass Blocks | A | Skip to main content in clinical shell | Axe and keyboard | Not recorded | Needs review | | | |
| 2.4.2 Page Titled | A | All routes and patient detail views | Axe and document review | Not recorded | Needs review | | | |
| 2.4.3 Focus Order | A | Multi-step prescription and appointment flows | Keyboard review | Not recorded | Needs review | | | |
| 2.4.4 Link Purpose (In Context) | A | Patient records and report action links | Axe and screen reader | Not recorded | Needs review | | | |
| 2.4.5 Multiple Ways | AA | Directory search, sidebar, and breadcrumbs | Navigation review | Not recorded | Needs review | | | |
| 2.4.6 Headings and Labels | AA | Clinical sections and medical forms | Axe and accessibility tree | Not recorded | Needs review | | | |
| 2.4.7 Focus Visible | AA | All interactive controls and buttons | Keyboard and visual review | Not recorded | Needs review | | | |
| 2.4.11 Focus Not Obscured (Minimum) | AA | Sticky headers, bottom nav, dialogs | Keyboard and viewport review | Not recorded | Needs review | | | |
| 2.4.12 Focus Not Obscured (Enhanced) | AAA | Sticky headers and mobile drawers | Keyboard and viewport review | Not recorded | Needs review | | | |
| 2.4.13 Focus Appearance | AAA | Interactive buttons, inputs, tabs | Visual review | Not recorded | Needs review | | | |
| 2.5.1 Pointer Gestures | A | Clinical timeline and swipeable cards | Touch review | Not recorded | Needs review | | | |
| 2.5.2 Pointer Cancellation | A | Form submissions and medication actions | Pointer review | Not recorded | Needs review | | | |
| 2.5.3 Label in Name | A | Action icon buttons with accessible labels | Accessibility tree | Not recorded | Needs review | | | |
| 2.5.4 Motion Actuation | A | Voice consult and device actions | Motion review | Not recorded | N/A with rationale | | | No motion-actuated device interactions |
| 2.5.5 Target Size (Enhanced) | AAA | Mobile bottom nav and vital action targets | Touch and visual review | Not recorded | Needs review | | | |
| 2.5.7 Dragging Movements | AA | Timeline scrolling and record reordering | Touch and keyboard review | Not recorded | N/A with rationale | | | All draggable views have accessible button equivalents |
| 2.5.8 Target Size (Minimum) | AA | Buttons, chips, table row actions | Touch and visual review | Not recorded | Needs review | | | |
| 3.1.1 Language of Page | A | Multi-locale HTML document declaration | DOM and screen reader | Not recorded | Needs review | | | |
| 3.1.2 Language of Parts | AA | Multi-language clinical terminology | DOM and content review | Not recorded | Needs review | | | |
| 3.1.3 Unusual Words | AAA | Medical terms and clinical abbreviations | Content review | Not recorded | Needs review | | | |
| 3.2.1 On Focus | A | Filter dropdowns and patient selectors | Keyboard review | Not recorded | Needs review | | | |
| 3.2.2 On Input | A | Patient search and dosage selectors | Keyboard review | Not recorded | Needs review | | | |
| 3.2.3 Consistent Navigation | AA | Application header, sidebar, bottom nav | Cross-route review | Not recorded | Needs review | | | |
| 3.2.4 Consistent Identification | AA | Vital status chips, icons, and action items | Cross-route review | Not recorded | Needs review | | | |
| 3.3.1 Error Identification | A | Clinical form validation and auth errors | Form and screen-reader review | Not recorded | Needs review | | | |
| 3.3.2 Labels or Instructions | A | Prescription and appointment inputs | Accessibility tree | Not recorded | Needs review | | | |
| 3.3.3 Error Suggestion | AA | Dosage errors and search corrections | Form review | Not recorded | Needs review | | | |
| 3.3.4 Error Prevention (Legal, Financial, Data) | AA | Patient record deletion and prescription signing | Form review | Not recorded | Needs review | | | |
| 3.3.5 Help | AAA | Contextual clinical guidance and tooltips | Content review | Not recorded | Needs review | | | |
| 3.3.6 Error Prevention (All) | AAA | All medical form submissions | Form review | Not recorded | Needs review | | | |
| 4.1.2 Name, Role, Value | A | Custom Radix components and drawers | Axe and accessibility tree | Not recorded | Needs review | | | |
| 4.1.3 Status Messages | AA | Toast notifications and offline status alerts | Screen reader review | Not recorded | Needs review | | | |

## Manual sign-off

| Review environment | Reviewer | Date | Status | Evidence | Notes |
| --- | --- | --- | --- | --- | --- |
| Keyboard only, Chromium | Accessibility team | 2026-09-26 | Needs review | Not recorded | Initial review scheduled |
| VoiceOver with Safari on macOS | Accessibility team | 2026-09-26 | Needs review | Not recorded | Initial review scheduled |
| NVDA with Firefox on Windows | Accessibility team | 2026-09-26 | Needs review | Not recorded | Initial review scheduled |
| 200% and 400% zoom, 320px reflow | Accessibility team | 2026-09-26 | Needs review | Not recorded | Initial review scheduled |
| Light, dark, reduced motion, and forced colors | Accessibility team | 2026-09-26 | Needs review | Not recorded | Initial review scheduled |

## Exceptions

Exceptions are scoped test dispositions, not accessibility waivers. Each exception requires documented impact, mitigation, ownership, follow-up, and evidence before release.

| Scope | Reason | User impact | Mitigation | Owner | Follow-up date | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| Health ID QR code canvas `.health-id-qr` | QR code visual matrix generated on HTML canvas | Cannot be parsed as standard text contrast by automated scanners | Provided alongside clear high-contrast textual Health ID number and download link | Engineering team | 2026-10-15 | Visual review confirmed high contrast (black on white) |
| Telehealth consultation video room iframe | Third-party Daily.co embedded consultation frame | External DOM boundary limits in-tree accessibility scanning | Surrounded by accessible call control buttons (mute, camera, end call) in native DOM | Engineering team | 2026-10-15 | Call controls keyboard accessible and labeled |
