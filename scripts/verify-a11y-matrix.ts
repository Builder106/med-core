import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type ValidationMode = 'pr' | 'release';

const matrixPath = resolve(process.cwd(), 'docs/accessibility-matrix.md');
const matrix = readFileSync(matrixPath, 'utf8');
const modeArgument = process.argv.find((argument) => argument.startsWith('--mode='));
const mode = modeArgument?.slice('--mode='.length) as ValidationMode | undefined;
const failures: string[] = [];
const allowedStatuses = new Set(['Pass', 'Fail', 'Needs review', 'N/A with rationale']);

if (mode !== 'pr' && mode !== 'release') failures.push('Use --mode=pr or --mode=release.');

for (const requiredHeading of ['## Route and state coverage', '## WCAG 2.2 success criteria', '## Manual sign-off', '## Exceptions']) {
  if (!matrix.includes(requiredHeading)) failures.push(`Missing required section: ${requiredHeading}`);
}

if (/\bPending\b/.test(matrix)) failures.push('The accessibility matrix contains obsolete Pending evidence values.');
if (/- \[ \]/.test(matrix)) failures.push('The accessibility matrix contains unchecked required items.');

const tableRows = (sectionHeading: string): string[][] => {
  const sectionStart = matrix.indexOf(sectionHeading);
  if (sectionStart < 0) return [];
  const section = matrix.slice(sectionStart + sectionHeading.length);
  const sectionEnd = section.search(/\n##? /);
  const body = sectionEnd >= 0 ? section.slice(0, sectionEnd) : section;
  return body
    .split('\n')
    .filter((line) => line.trim().startsWith('|') && !/^\|\s*-/.test(line))
    .map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim()));
};

const validateTable = (heading: string, requiredColumns: string[]): string[][] => {
  const rows = tableRows(heading);
  if (rows.length === 0) {
    failures.push(`Missing table under ${heading}.`);
    return [];
  }
  const headers = rows[0].map((header) => header.toLowerCase());
  for (const requiredColumn of requiredColumns) {
    if (!headers.includes(requiredColumn.toLowerCase())) failures.push(`Table under ${heading} is missing the ${requiredColumn} column.`);
  }
  return rows.slice(1);
};

const routeRows = validateTable('## Route and state coverage', ['Surface', 'State or role', 'Automated coverage', 'Manual status', 'Evidence']);
const criterionRows = validateTable('## WCAG 2.2 success criteria', ['Criterion', 'Level', 'Surface or state', 'Method', 'Evidence', 'Status', 'Reviewer', 'Date', 'Rationale or issue']);
const signoffRows = validateTable('## Manual sign-off', ['Review environment', 'Reviewer', 'Date', 'Status', 'Evidence', 'Notes']);
const exceptionRows = validateTable('## Exceptions', ['Scope', 'Reason', 'User impact', 'Mitigation', 'Owner', 'Follow-up date', 'Evidence']);

const statusAt = (row: string[], column: string, heading: string): string | undefined => {
  const rows = tableRows(heading);
  const header = rows[0]?.map((cell) => cell.toLowerCase());
  const index = header?.indexOf(column.toLowerCase());
  return index === undefined || index < 0 ? undefined : row[index];
};

const validateStatus = (status: string | undefined, context: string): void => {
  if (!status || !allowedStatuses.has(status)) failures.push(`${context} has an invalid or missing status.`);
};

for (const [index, row] of routeRows.entries()) {
  if (row.some((cell) => cell.length === 0)) failures.push(`Route coverage row ${index + 1} has a missing required field.`);
  validateStatus(statusAt(row, 'Manual status', '## Route and state coverage'), `Route coverage row ${index + 1}`);
}

for (const [index, row] of criterionRows.entries()) {
  if (row.length < 9 || row.slice(0, 6).some((cell) => cell.length === 0)) failures.push(`WCAG criterion row ${index + 1} has a missing required field.`);
  validateStatus(statusAt(row, 'Status', '## WCAG 2.2 success criteria'), `WCAG criterion row ${index + 1}`);
}

for (const [index, row] of signoffRows.entries()) {
  if (row.length < 6 || row[0].length === 0) failures.push(`Manual sign-off row ${index + 1} has a missing environment.`);
  validateStatus(statusAt(row, 'Status', '## Manual sign-off'), `Manual sign-off row ${index + 1}`);
}

if (mode === 'release') {
  const releaseRows = [
    ...routeRows.map((row) => ({ row, heading: '## Route and state coverage', column: 'Manual status' })),
    ...criterionRows.map((row) => ({ row, heading: '## WCAG 2.2 success criteria', column: 'Status' })),
    ...signoffRows.map((row) => ({ row, heading: '## Manual sign-off', column: 'Status' }))
  ];
  for (const [index, { row, heading, column }] of releaseRows.entries()) {
    const status = statusAt(row, column, heading);
    if (status !== 'Pass' && status !== 'N/A with rationale') failures.push(`Release evidence row ${index + 1} is unresolved: ${status ?? 'missing status'}.`);
    if (row.some((cell) => cell.length === 0)) failures.push(`Release evidence row ${index + 1} has blank evidence metadata.`);
  }
  for (const [index, row] of exceptionRows.entries()) {
    if (row.length < 7 || row.some((cell) => cell.length === 0)) failures.push(`Exception row ${index + 1} is missing scope, rationale, mitigation, ownership, follow-up, or evidence.`);
  }
}

if (failures.length > 0) {
  console.error(`Accessibility evidence matrix failed ${mode ?? 'mode'} validation.`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Accessibility evidence matrix passed ${mode} validation.`);
