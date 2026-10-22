// Supported and Planned Regional Datacenter Identifiers
export const REGIONS = {
  PK: 'PK',
  IND: 'IND',
  USA: 'USA',
  EU: 'EU',
  UAE: 'UAE',
  SHARD1: 'shard-1',
  SHARD2: 'shard-2',
} as const;

export type RegionCode = (typeof REGIONS)[keyof typeof REGIONS] | string;

export const SUPPORTED_REGIONS: string[] = [
  REGIONS.PK,
  REGIONS.IND,
  REGIONS.USA,
  REGIONS.EU,
  REGIONS.UAE,
  REGIONS.SHARD1,
  REGIONS.SHARD2,
];

export const ALL_REGIONS: string[] = [
  REGIONS.PK,
  REGIONS.IND,
  REGIONS.USA,
  REGIONS.EU,
  REGIONS.UAE,
  REGIONS.SHARD1,
  REGIONS.SHARD2,
];

export const DEFAULT_REGION: string = REGIONS.PK;

// Helper to sanitize and validate region input (accepts any 2-10 character alphanumeric country/region code)
export function isValidRegion(region?: string | null): region is RegionCode {
  if (!region) return false;
  return /^[A-Za-z0-9_-]{2,10}$/.test(region.trim());
}
