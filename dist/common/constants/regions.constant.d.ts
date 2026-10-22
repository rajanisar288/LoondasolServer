export declare const REGIONS: {
    readonly PK: "PK";
    readonly IND: "IND";
    readonly USA: "USA";
    readonly EU: "EU";
    readonly UAE: "UAE";
    readonly SHARD1: "shard-1";
    readonly SHARD2: "shard-2";
};
export type RegionCode = (typeof REGIONS)[keyof typeof REGIONS] | string;
export declare const SUPPORTED_REGIONS: string[];
export declare const ALL_REGIONS: string[];
export declare const DEFAULT_REGION: string;
export declare function isValidRegion(region?: string | null): region is RegionCode;
