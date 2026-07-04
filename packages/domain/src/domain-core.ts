import { loadContractManifest, type ContractManifest } from '@urms/shared';

/** Domain Core 骨格（S2: Resource / Mode / Event 実装） */
export interface DomainCore {
  readonly contract: ContractManifest;
  readonly version: string;
}

export function createDomainCore(): DomainCore {
  return {
    contract: loadContractManifest(),
    version: '0.2.0-s2',
  };
}
