/** ResourceTypePlugin 公開情報（API 応答用） */
export interface ResourceTypePluginInfo {
  resourceType: string;
  version: string;
  coreVersion: string;
  searchableFields: string[];
}

export interface PluginValidationDetail {
  field?: string;
  message: string;
}
