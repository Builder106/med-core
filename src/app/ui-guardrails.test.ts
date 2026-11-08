// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));

function readProjectFile(relativePath: string) {
  return readFileSync(resolve(root, relativePath), 'utf8');
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx$/.test(entry.name) && !/\.test\./.test(entry.name) ? [path] : [];
  });
}

const appSources = sourceFiles(resolve(root, 'src/app')).map(path => ({
  path: relative(root, path),
  text: readFileSync(path, 'utf8'),
}));

function offenders(pattern: RegExp) {
  return appSources.filter(file => pattern.test(file.text)).map(file => file.path);
}

describe('design tokens', () => {
  it('uses the PRD neutral background and the brand green', () => {
    const themeCss = readProjectFile('src/styles/theme.css');
    expect(themeCss).toContain('--background: #f8f9fb;');
    expect(themeCss).toContain('--primary: #214838;');
    expect(themeCss).toContain('--sidebar: #214838;');
  });

  it('loads one sans-serif family', () => {
    const fontsCss = readProjectFile('src/styles/fonts.css');
    expect(fontsCss).toContain('family=IBM+Plex+Sans');
    expect(fontsCss).not.toMatch(/Serif/);
  });

  it('routes colours through tokens instead of hard-coded hex classes', () => {
    expect(offenders(/(?:bg|text|border|from|via|to)-\[#[0-9a-fA-F]{6}\]/)).toEqual([]);
  });
});

describe('banned UI patterns', () => {
  it('has no tracked uppercase eyebrow labels', () => {
    expect(offenders(/\btracking-(?:wide|wider|widest|\[)/)).toEqual([]);
  });

  it('has no pulsing or pinging indicator dots', () => {
    expect(offenders(/\banimate-(?:ping|pulse|bounce)\b/)).toEqual([]);
  });

  it('has no left accent rails', () => {
    expect(offenders(/\bborder-l-(?:2|4|8|\[)/)).toEqual([]);
  });

  it('has no middle-dot separators', () => {
    expect(offenders(/ [·•] /)).toEqual([]);
  });

  it('has no decorative gradients or hover lifts', () => {
    expect(offenders(/\bbg-gradient-to-(?:r|br|tr|b)\b|\baf-elevate\b/)).toEqual([]);
  });

  it('has no sparkle icon standing in for AI', () => {
    expect(offenders(/\bSparkles\b/)).toEqual([]);
  });
});

describe('buttons', () => {
  it('gives every button a handler or a submit role', () => {
    const dead = appSources.flatMap(file =>
      [...file.text.matchAll(/<button\b([\s\S]*?)>/g)]
        .filter(match => !/onClick|type="submit"/.test(match[1]))
        .map(() => file.path)
    );
    expect(dead).toEqual([]);
  });
});
