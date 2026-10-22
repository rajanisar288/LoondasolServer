export interface ShardConfig {
    name: string;
    uri: string;
    countries: string[];
}
export interface ShardingStructure {
    shards: {
        shard1: ShardConfig;
        shard2: ShardConfig;
        [key: string]: ShardConfig;
    };
    defaultShard: string;
    getShardForCountry(countryCode?: string): ShardConfig;
}
export declare const shardingConfig: ShardingStructure;
export default shardingConfig;
