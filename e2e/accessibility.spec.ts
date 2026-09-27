import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

type Theme = 'light' | 'dark';
type AxeResultKind = 'violations' | 'incomplete';
type AuditTarget = { name: string; path: string; state?: string; smoke?: boolean };
type AxeCheck = { data?: { bgColor?: unknown; fgColor?: unknown; messageKey?: unknown } | null };
type AxeNode = { target: unknown; any?: AxeCheck[]; all?: AxeCheck[] };
type AxeResult = { id: string; help: string; nodes: AxeNode[] };

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
] as const;

const THEMES: readonly Theme[] = ['light', 'dark'];
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'wcag2aaa', 'best-practice'];
const AAA_RULES = {
  'color-contrast-enhanced': { enabled: true },
  'identical-links-same-purpose': { enabled: true },
  'meta-refresh-no-exceptions': { enabled: true },
};

const auditTargets: readonly AuditTarget[] = [
  { name: 'login', path: '/login', smoke: true },
  { name: 'consent', path: '/consent' },
  { name: 'patients-directory', path: '/patients', smoke: true },
  { name: 'appointments', path: '/appointments', smoke: true },
  { name: 'prescriptions', path: '/prescriptions', smoke: true },
  { name: 'lab-results', path: '/lab-results' },
  { name: 'health-id', path: '/health-id', smoke: true },
  { name: 'voice-consult', path: '/voice-consult' },
  { name: 'ai-assist', path: '/ai-assist', smoke: true },
];

/**
 * Filter documented exceptions recorded in docs/accessibility-matrix.md
 */
async function applyDocumentedExceptions(
  results: AxeResult[],
  target: AuditTarget,
  page: Page,
  kind: AxeResultKind
): Promise<AxeResult[]> {
  const filteredResults: AxeResult[] = [];
  for (const result of results) {
    if (result.id !== 'color-contrast' && result.id !== 'color-contrast-enhanced') {
      filteredResults.push(result);
      continue;
    }
    const nodes: AxeNode[] = [];
    for (const node of result.nodes) {
      const targetSelector = String(node.target);
      // Exception: Health ID QR code canvas
      if (target.name === 'health-id' && (targetSelector.includes('.health-id-qr') || targetSelector.includes('canvas'))) {
        continue;
      }
      // Exception: Telehealth iframe container
      if ((target.name === 'voice-consult' || target.name === 'video-consult') && targetSelector.includes('iframe')) {
        continue;
      }
      nodes.push(node);
    }
    if (nodes.length > 0) {
      filteredResults.push({ ...result, nodes });
    }
  }
  return filteredResults;
}

function formatResults(results: AxeResult[]): string {
  return results
    .map(
      (r) =>
        `- [${r.id}] ${r.help}\n  Nodes:\n${r.nodes.map((n) => `    * ${JSON.stringify(n.target)}`).join('\n')}`
    )
    .join('\n');
}

test.describe.configure({ mode: 'parallel' });

for (const theme of THEMES) {
  for (const viewport of VIEWPORTS) {
    test.describe(`WCAG 2.2 AAA audit: ${theme} ${viewport.name}`, () => {
      test.use({
        colorScheme: theme,
        viewport: { width: viewport.width, height: viewport.height },
      });

      for (const target of auditTargets) {
        test(`${target.name}`, async ({ page }, testInfo) => {
          // Representative smoke for non-desktop viewports
          if (viewport.name !== 'desktop' && !target.smoke) {
            test.skip(true, 'Desktop and representative smoke viewports only');
          }

          await page.addInitScript((selectedTheme) => {
            window.localStorage.setItem('theme', selectedTheme);
          }, theme);

          await page.goto(target.path, { waitUntil: 'domcontentloaded' });
          await page.waitForTimeout(300);

          const results = await new AxeBuilder({ page })
            .options({
              runOnly: { type: 'tag', values: WCAG_TAGS },
              rules: AAA_RULES,
            })
            .analyze();

          const violations = await applyDocumentedExceptions(
            results.violations as AxeResult[],
            target,
            page,
            'violations'
          );
          const incomplete = await applyDocumentedExceptions(
            results.incomplete as AxeResult[],
            target,
            page,
            'incomplete'
          );

          const outputDir = path.resolve(process.cwd(), 'audit-output/accessibility');
          fs.mkdirSync(outputDir, { recursive: true });
          const outputPath = path.join(
            outputDir,
            `${target.name}-${theme}-${viewport.name}.json`
          );
          fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

          expect(
            violations,
            `${target.name} has accessibility violations:\n${formatResults(violations)}`
          ).toEqual([]);

          expect(
            incomplete,
            `${target.name} has unresolved accessibility reviews:\n${formatResults(incomplete)}`
          ).toEqual([]);
        });
      }
    });
  }
}
