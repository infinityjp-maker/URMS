import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

export type AiTeamSourceSpec = {
  globLabel: string;
  resolveFiles: (repoRoot: string) => Promise<string[]>;
};

async function listFiles(dir: string, matcher: (name: string) => boolean): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  return entries.filter((entry) => entry.isFile() && matcher(entry.name)).map((entry) => path.join(dir, entry.name));
}

export const AI_TEAM_SOURCES: AiTeamSourceSpec[] = [
  {
    globLabel: '.cursor/rules/*.mdc',
    resolveFiles: async (repoRoot) => listFiles(path.join(repoRoot, '.cursor/rules'), (name) => name.endsWith('.mdc')),
  },
  {
    globLabel: '.cursor/commands/*.md',
    resolveFiles: async (repoRoot) => listFiles(path.join(repoRoot, '.cursor/commands'), (name) => name.endsWith('.md')),
  },
  {
    globLabel: '.cursor/context/*.md',
    resolveFiles: async (repoRoot) => listFiles(path.join(repoRoot, '.cursor/context'), (name) => name.endsWith('.md')),
  },
  {
    globLabel: '.cursor/skills/*/SKILL.md',
    resolveFiles: async (repoRoot) => {
      const skillsDir = path.join(repoRoot, '.cursor/skills');
      const entries = await readdir(skillsDir, { withFileTypes: true });
      return entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => path.join(skillsDir, entry.name, 'SKILL.md'));
    },
  },
  {
    globLabel: 'docs/ai-team/*.md',
    resolveFiles: async (repoRoot) =>
      listFiles(path.join(repoRoot, 'docs/ai-team'), (name) => name.endsWith('.md') && name !== '99_Template.md'),
  },
  {
    globLabel: 'docs/project/decisions/ADR-*.md',
    resolveFiles: async (repoRoot) =>
      listFiles(path.join(repoRoot, 'docs/project/decisions'), (name) => name.startsWith('ADR-') && name.endsWith('.md')),
  },
];

export async function readRepoFile(absolutePath: string): Promise<string> {
  return readFile(absolutePath, 'utf8');
}

export function toRepoRelative(repoRoot: string, absolutePath: string): string {
  return path.relative(repoRoot, absolutePath).replace(/\\/g, '/');
}

export function fallbackNameFromPath(relativePath: string): string {
  return path.basename(relativePath, path.extname(relativePath));
}
