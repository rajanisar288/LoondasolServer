"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_REGION = exports.ALL_REGIONS = exports.SUPPORTED_REGIONS = exports.REGIONS = void 0;
exports.isValidRegion = isValidRegion;
exports.REGIONS = {
    PK: 'PK',
    IND: 'IND',
    USA: 'USA',
    EU: 'EU',
    UAE: 'UAE',
    SHARD1: 'shard-1',
    SHARD2: 'shard-2',
};
exports.SUPPORTED_REGIONS = [
    exports.REGIONS.PK,
    exports.REGIONS.IND,
    exports.REGIONS.USA,
    exports.REGIONS.EU,
    exports.REGIONS.UAE,
    exports.REGIONS.SHARD1,
    exports.REGIONS.SHARD2,
];
exports.ALL_REGIONS = [
    exports.REGIONS.PK,
    exports.REGIONS.IND,
    exports.REGIONS.USA,
    exports.REGIONS.EU,
    exports.REGIONS.UAE,
    exports.REGIONS.SHARD1,
    exports.REGIONS.SHARD2,
];
exports.DEFAULT_REGION = exports.REGIONS.PK;
function isValidRegion(region) {
    if (!region)
        return false;
    return /^[A-Za-z0-9_-]{2,10}$/.test(region.trim());
}
//# sourceMappingURL=regions.constant.js.map