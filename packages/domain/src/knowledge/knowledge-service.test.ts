import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { findKnowledgeDocument } from './document-catalog.js';
import { createKnowledgeService } from './knowledge-service.js';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

describe('knowledge catalog', () => {
  it('finds document by id', () => {
    expect(findKnowledgeDocument('dev-playbook')?.path).toContain('developer-playbook');
  });
});

describe('FileKnowledgeService', () => {
  it('lists curated documents', async () => {
    const service = createKnowledgeService({ repoRoot: REPO_ROOT });
    const payload = await service.listDocuments();
    expect(payload.documents.length).toBeGreaterThan(3);
  });

  it('reads markdown content for known doc', async () => {
    const service = createKnowledgeService({ repoRoot: REPO_ROOT });
    const doc = await service.getDocument('readme');
    expect(doc).not.toBeNull();
    expect(doc?.content).toContain('URMS');
  });
});