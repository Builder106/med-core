# WCAG 2.2 AAA-Oriented Accessibility Audit Guide

This guide defines a repeatable accessibility audit for web projects. It is
written to work with any framework, browser automation tool, hosting model,
and authentication system.

## What this audit means

An AAA-oriented audit applies the strongest practical review standard across
all applicable WCAG 2.2 Level A, AA, and AAA success criteria. It does not
create a formal AAA conformance claim by itself. Automation finds only a
subset of accessibility problems, and some AAA criteria require human
judgment or depend on the content being published.

Before making a formal claim, review every applicable criterion, document the
result for every included page and state, and provide evidence from automated,
manual, and assistive technology testing. Record an `N/A with rationale` only
when the criterion is genuinely not applicable to the product or content.

## Scope discovery

Build the audit inventory before running tests. The inventory must include:

- Every public route, authenticated route, embedded surface, and error page.
- Every role, permission level, locale, theme, and feature-flag variation.
- Loading, empty, success, error, disabled, offline, and permission-denied
  states.
- Menus, dialogs, popovers, comboboxes, tabs, accordions, date pickers,
  drag-and-drop controls, file uploads, and other custom widgets.
- Authentication, session expiry, password recovery, multi-factor flows,
  timeout warnings, and reauthentication.
- Media, animation, charts, maps, documents, generated content, and external
  integrations.
- Responsive widths, text zoom, browser zoom, reduced motion, high contrast,
  forced colors, touch input, mouse input, keyboard input, and screen readers.

For each inventory item, record a stable identifier, URL or entry point,
required session, state setup, viewport, theme, and evidence location. Keep
the inventory under version control and fail the release gate when a required
entry is missing evidence.

## Status vocabulary

Use these statuses consistently. Use `Not recorded` only for an evidence field;
it is not a status.

- `Pass`: the criterion passed for the recorded scope and has attached
  evidence.
- `Fail`: a reproducible violation exists. Record the affected surface,
  expected behavior, actual behavior, owner, and remediation issue.
- `Needs review`: automation or a reviewer found an ambiguous, incomplete, or
  content-dependent result. It blocks release until a person records a
  disposition.
- `N/A with rationale`: the criterion does not apply. State why it does not
  apply and identify the reviewer who made that decision.

Do not use `Pass` for an untested item, and do not treat an empty automated
result as proof of conformance.

## Audit workflow

### 1. Prepare the test environment

Use a production-like build with representative content and deterministic test
data. Add a guarded local harness when authenticated or role-specific states
cannot be reached without live accounts. The harness should:

1. Activate only in a dedicated test environment.
2. Be disabled when the environment flag is absent.
3. Be disabled in production regardless of request input.
4. Use fixed identities, roles, records, and timestamps.
5. Avoid live third-party services and real user data.
6. Exercise the same authorization checks as production.
7. Leave no test credentials or bypass behavior in the production bundle.

Capture browser, operating system, assistive technology, viewport, zoom,
theme, locale, commit, and test-data version with each evidence set.

### 2. Run automated checks

Run an accessibility engine such as axe against every inventory item and
important state. Include the WCAG 2.0, 2.1, and 2.2 A and AA tags, the AAA
tagset, and the tool's best-practice rules. Enable any AAA rules that the tool
ships disabled by default, such as enhanced contrast and equivalent-link
purpose checks.

Automated violations are blocking failures. Automated `incomplete` results
are blocking manual-review items. Store the complete JSON result, browser
trace, screenshot, and video where available. Never turn off a rule only to
make the gate pass. If a rule is not applicable, document the scoped exception
in the evidence matrix and retain the manual review.

A project using Playwright and axe can adapt this example:

```ts
import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';

const tags = [
  'wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa',
  'wcag2aaa', 'best-practice'
];

test('accessibility gate', async ({ page }) => {
  await page.goto(process.env.AUDIT_URL ?? 'http://localhost:3000');

  const results = await new AxeBuilder({ page })
    .withTags(tags)
    .options({
      rules: {
        'color-contrast-enhanced': { enabled: true },
        'identical-links-same-purpose': { enabled: true },
        'meta-refresh-no-exceptions': { enabled: true }
      }
    })
    .analyze();

  expect(results.violations, JSON.stringify(results.violations, null, 2))
    .toEqual([]);
  expect(results.incomplete, JSON.stringify(results.incomplete, null, 2))
    .toEqual([]);
});
```

The example is a starting point, not a complete AAA test. Add route discovery,
state setup, viewport and theme projects, reduced-motion emulation, and JSON
artifact handling for the target application.

### 3. Complete manual review

Use the POUR sections below as the manual checklist. Test both the default
state and every state that changes structure, focus, instructions, content,
or available actions.

### 4. Record evidence and disposition

Each individual criterion row must identify the surface, method, evidence path, status,
reviewer, date, and issue or rationale. Link failures to remediation issues.
Attach screenshots or recordings for visual and interaction findings, and
retain screen-reader notes or transcripts for auditory findings.

### 5. Re-test and release

Re-run automation after every remediation. Repeat affected manual checks,
then complete a representative end-to-end pass with keyboard and assistive
technology. The PR matrix check validates inventory and evidence shape while
allowing unresolved manual review. The release gate remains closed while any
violation, incomplete result, unresolved review item, unchecked matrix row,
blank evidence metadata, or undocumented exception remains. Run the validator
with `--mode=pr` in pull requests and `--mode=release` for release evidence.

The matrix must use the WCAG 2.2 criterion levels. In particular, 1.3.6
Identify Purpose and 2.5.5 Target Size (Enhanced) are AAA criteria. WCAG 2.2
does not include the retired 4.1.1 Parsing criterion; do not record it as an
active criterion.

## POUR review checklist

### Perceivable

Review all applicable Level A, AA, and AAA criteria in the 1.x groups.

- **Text alternatives:** Give informative images meaningful alternatives,
  mark decorative images as decorative, and provide equivalent alternatives
  for charts, diagrams, icons, canvas content, and generated media.
- **Time-based media:** Provide captions, audio descriptions, transcripts,
  extended descriptions, and sign-language interpretation when the applicable
  criterion requires them. Check prerecorded and live content separately.
- **Adaptable structure:** Verify headings, landmarks, lists, tables, reading
  order, relationships, labels, instructions, and programmatic names in the
  accessibility tree. Confirm that CSS and responsive layouts do not change
  the intended reading order.
- **Distinguishable presentation:** Test text contrast, enhanced contrast,
  non-text contrast, focus indicators, link identification, text spacing,
  hover and focus content, reflow, orientation, text resizing, and content
  shown on top of other content. Do not rely on color, sound, shape, or
  position alone.
- **Motion and sensory content:** Check flashing, animation, parallax, sound,
  background audio, and moving or auto-updating content. Provide pause, stop,
  hide, or equivalent controls where required, and honor reduced-motion
  preferences.

### Operable

Review all applicable Level A, AA, and AAA criteria in the 2.x groups.

- **Keyboard:** Every action must be reachable and usable with a keyboard.
  Check logical tab order, no keyboard trap, shortcut discoverability,
  focus restoration, dialog focus, menu focus, and escape behavior.
- **Timing:** Identify session expiration, countdowns, auto-logout, rotating
  content, rate limits, and time-limited forms. Provide warnings, extensions,
  pause controls, or alternatives required by the applicable criterion.
- **Seizures and physical reactions:** Check flashing frequency, repeated
  motion, animation, vestibular effects, and unexpected movement. Test with
  reduced motion and with animation disabled.
- **Navigation:** Check page titles, headings, landmarks, skip links, focus
  order, focus visibility, focus obstruction, link purpose, consistent
  navigation, multiple ways to locate content, current location, and section
  headings. Verify that focus is not hidden behind sticky UI.
- **Input modalities:** Test touch, mouse, pen, keyboard, speech input, and
  assistive technology. Check pointer cancellation, labels in names, target
  size, dragging alternatives, multipoint gestures, motion input, and
  orientation. A practical AAA-oriented target is at least 44 by 44 CSS
  pixels unless a documented exception applies.

### Understandable

Review all applicable Level A, AA, and AAA criteria in the 3.x groups.

- **Readable content:** Set the document language, identify language changes,
  expand abbreviations, explain unusual words, and use headings and plain
  instructions. Review reading level when the content is intended for a broad
  audience and provide simpler alternatives when appropriate.
- **Predictable behavior:** Keep navigation and component identification
  consistent. Do not change context on focus or input without clear warning.
  Make help, labels, error handling, and repeated controls consistent.
- **Input assistance:** Provide visible labels, instructions, required-state
  information, input purpose, error identification, specific corrections,
  suggestions, review before submission, reversible actions, and accessible
  authentication. Preserve user-entered data when validation fails.
- **Help and recovery:** Make support channels discoverable and consistent.
  Check password managers, paste, autofill, passkeys, recovery codes, and
  authentication alternatives. Do not require a memory or transcription task
  when an equivalent secure method is possible.

### Robust

Review all applicable Level A, AA, and AAA criteria in the 4.x groups.

- Validate HTML and inspect the accessibility tree for valid names, roles,
  states, values, and relationships.
- Test custom controls with keyboard, pointer, screen reader, browser zoom,
  touch, and high contrast or forced-colors modes.
- Verify status messages, alerts, validation results, loading announcements,
  live regions, and progress updates without moving focus unnecessarily.
- Check that scripts, hydration, navigation, and asynchronous updates do not
  remove focus, duplicate content, or create stale accessible names.
- Confirm compatibility with at least one macOS screen reader and one Windows
  screen reader, plus the browser combinations used by the audience.

## Required manual test procedures

### Keyboard-only navigation

Disable the mouse and complete representative tasks using `Tab`, `Shift+Tab`,
`Enter`, `Space`, arrow keys, `Home`, `End`, and `Escape`. Check that every
interactive element receives a visible focus indicator, focus order matches
the intended task order, dialogs trap focus correctly, and closing a surface
returns focus to a sensible trigger. Test nested menus, validation errors,
loading states, and dynamically inserted content.

### VoiceOver and NVDA

Run the primary workflows with VoiceOver and Safari on macOS, then with NVDA
and Firefox on Windows. Record spoken names, roles, states, values, landmark
navigation, heading navigation, table navigation, form mode changes, live
region announcements, dialog behavior, and error recovery. Repeat the checks
with a real screen-reader user when the product serves a broad audience.

### Zoom, reflow, and text spacing

Test browser zoom at 200% and 400%, operating-system text scaling where
available, and a viewport equivalent to 320 CSS pixels. Check that content
reflows without two-dimensional scrolling, controls remain usable, text is
not clipped, sticky elements do not obscure focus, and no essential content
depends on hover. Apply the WCAG text-spacing override values and verify that
content remains readable and operable.

### Contrast and non-text contrast

Measure actual rendered foreground and background combinations in light and
dark themes, including hover, focus, disabled, error, selected, visited, and
high-contrast states. Check text, icons, borders, focus indicators, chart
series, form controls, and meaningful graphical objects. Test gradients,
transparency, images, overlays, and text placed over media manually because
static token inspection is insufficient.

### Forms, errors, authentication, and status

Submit empty, malformed, duplicate, partial, and valid data. Confirm that each
error is associated with its field, announced to assistive technology, written
in plain language, and accompanied by a correction suggestion when possible.
Check required fields, autocomplete purpose, confirmation before destructive
actions, recoverability, session expiry, password requirements, password
manager and paste support, multi-factor alternatives, loading announcements,
success messages, and background status updates.

### Media, audio, and animation

Check captions, transcripts, audio description, sign-language alternatives,
player keyboard controls, volume, pause, seek, and live-media behavior. Test
autoplay, background audio, flashing, animation, motion sickness triggers,
reduced-motion preferences, and a no-animation fallback. Confirm that meaning
is preserved when motion is removed.

### Gestures, dragging, and orientation

Use one-pointer alternatives for multipoint or path gestures. Provide buttons
or keyboard alternatives for drag actions. Check pointer cancellation and
accidental activation. Test portrait and landscape orientation, touch target
spacing, coarse pointers, and device rotation without loss of state.

## Evidence requirements

For every criterion and applicable surface, retain:

- Criterion identifier and level.
- Route, component, or state identifier.
- Test method, tool version, browser, operating system, and assistive
  technology when applicable.
- Commit or build identifier and test data version.
- Screenshot, video, trace, JSON result, screen-reader notes, or manual test
  recording appropriate to the finding.
- Status, reviewer, review date, and linked remediation issue.
- A precise rationale for every `N/A with rationale`.

Evidence must be reproducible. A screenshot alone does not prove keyboard,
screen-reader, timing, authentication, or dynamic-state behavior.

## Pull request gate

Copy and adapt this checklist to accessibility-sensitive pull requests:

```text
Scope inventory updated: [ ]
Automated A, AA, AAA, and best-practice checks run: [ ]
Automated violations: [count]
Automated incomplete results manually dispositioned: [count]
Keyboard review complete: [ ]
Screen-reader review complete: [ ]
Zoom, reflow, contrast, motion, and touch review complete: [ ]
Manual evidence matrix updated: [ ]
Unresolved Fail or Needs review items: [count]
Exceptions documented with rationale: [ ]
Release impact and remediation issue: [link or N/A]
```

The pull request must not claim that the product is WCAG 2.2 AAA conformant
unless every applicable criterion has completed evidence and the conformance
claim has been reviewed by the responsible accessibility authority.

## Release gate

A release is ready for an AAA-oriented target only when:

1. Every public and authenticated surface is in the scope inventory.
2. Automated violations are zero, and no incomplete result lacks a manual
   disposition.
3. Every required matrix row has evidence and a final status.
4. Keyboard, screen-reader, zoom, reflow, contrast, motion, touch, forms,
   authentication, and media reviews are complete.
5. Every failure has a remediation issue, owner, and retest result.
6. Every exception is documented, scoped, approved, and rechecked.
7. Production artifacts contain no test-only harness or authorization bypass.

Recommended wording for an incomplete or ongoing audit is:

> This project follows a WCAG 2.2 AAA-oriented accessibility audit process.
> Automated and manual results are tracked in the accessibility evidence
> matrix. This statement is not a formal WCAG 2.2 AAA conformance claim.

Use a formal conformance claim only after the applicable WCAG conformance
requirements, scope, technology assumptions, and evidence have been reviewed.
