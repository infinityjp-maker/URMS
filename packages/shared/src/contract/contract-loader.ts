/**
 * Contract Loader — SSOT 参照骨格（S1）
 * 実装契約本文は docs/ に正本。コードは参照メタデータのみ保持する。
 */

export const CONTRACT_SSOT = {
  documentPath: 'docs/implementation/01-implementation-contract.md',
  adr: 'ADR-017',
  version: '1.0',
} as const;

export interface ContractManifest {
  documentPath: string;
  adr: string;
  version: string;
  loadedAt: string;
}

/** SSOT メタデータを返す（評価エンジン S2+ で拡張） */
export function loadContractManifest(): ContractManifest {
  return {
    ...CONTRACT_SSOT,
    loadedAt: new Date().toISOString(),
  };
}
