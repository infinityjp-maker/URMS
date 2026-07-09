import { describe, expect, it } from 'vitest';

import { calendarDetailHref, catalogHref, knowledgeDocumentHref, parseAppRoute, pcPartsHref, phaseHref, readAssetId, readCalendarDetailDate, readKnowledgeDocumentId, screenHref } from './appRoute.js';

describe('appRoute', () => {
  it('parses catalog hash', () => {
    expect(parseAppRoute('#/screens')).toEqual({ kind: 'catalog' });
    expect(parseAppRoute('#/screens/')).toEqual({ kind: 'catalog' });
  });

  it('parses module screen hash', () => {
    expect(parseAppRoute('#/M-WEA-DET')).toEqual({ kind: 'screen', screenId: 'M-WEA-DET' });
    expect(parseAppRoute('#/M-CAL-MON')).toEqual({ kind: 'screen', screenId: 'M-CAL-MON' });
  });

  it('defaults to dashboard', () => {
    expect(parseAppRoute('')).toEqual({ kind: 'dashboard' });
    expect(parseAppRoute('#/')).toEqual({ kind: 'dashboard' });
    expect(parseAppRoute('#/other')).toEqual({ kind: 'dashboard' });
  });

  it('builds hrefs', () => {
    expect(catalogHref()).toBe('#/screens');
    expect(screenHref('M-WEA-DET')).toBe('#/M-WEA-DET');
    expect(phaseHref('day')).toBe('?phase=day');
  });

  it('reads calendar detail date from search params', () => {
    expect(readCalendarDetailDate('?calDate=2026-07-09')).toBe('2026-07-09');
    expect(readCalendarDetailDate('?phase=day')).toBeNull();
  });

  it('builds calendar detail href with date param', () => {
    expect(calendarDetailHref('2026-07-09')).toContain('calDate=2026-07-09');
    expect(calendarDetailHref('2026-07-09')).toContain('#/M-CAL-DET');
  });

  it('reads knowledge document id from search params', () => {
    expect(readKnowledgeDocumentId('?docId=readme')).toBe('readme');
    expect(readKnowledgeDocumentId('?phase=day')).toBeNull();
  });

  it('builds knowledge document href with docId param', () => {
    expect(knowledgeDocumentHref('readme')).toContain('docId=readme');
    expect(knowledgeDocumentHref('readme')).toContain('#/M-DOC-VIEW');
  });

  it('reads asset id and builds pc parts href', () => {
    expect(readAssetId('?assetId=gpu-rtx4070')).toBe('gpu-rtx4070');
    expect(pcPartsHref('gpu-rtx4070')).toContain('assetId=gpu-rtx4070');
    expect(pcPartsHref('gpu-rtx4070')).toContain('#/M-AST-PC');
  });
});
