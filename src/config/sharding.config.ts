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

export const shardingConfig: ShardingStructure = {
  shards: {
    shard1: {
      name: 'shard-1',
      uri:
        process.env.MONGODB_SHARD1_URI ||
        'mongodb+srv://ibsolangi444_db_user:jCX8cZ43BC30akBY@cluster0.rrpbdiu.mongodb.net/workivlab_shard1?retryWrites=true&w=majority',
      countries: ['IN', 'IND', 'PK', 'PAK', 'BD', 'BGD'],
    },
    shard2: {
      name: 'shard-2',
      uri:
        process.env.MONGODB_SHARD2_URI ||
        'mongodb+srv://ibsolangi444_db_user:jCX8cZ43BC30akBY@cluster0.rrpbdiu.mongodb.net/workivlab_shard2?retryWrites=true&w=majority',
      countries: [
        'US',
        'USA',
        'UK',
        'GB',
        'GBR',
        'CA',
        'CAN',
        'MX',
        'MEX',
        'AU',
        'AUS',
        'DE',
        'FR',
        'AE',
        'ARE',
        'EU',
      ],
    },
  },
  defaultShard: 'shard1',

  getShardForCountry(countryCode?: string): ShardConfig {
    if (countryCode && typeof countryCode === 'string') {
      const normalized = countryCode.trim().toUpperCase();
      // Direct shard key or name match
      if (normalized === 'SHARD-1' || normalized === 'SHARD1') {
        return this.shards.shard1;
      }
      if (normalized === 'SHARD-2' || normalized === 'SHARD2') {
        return this.shards.shard2;
      }

      // Match against country lists
      for (const [, shard] of Object.entries(this.shards)) {
        if (shard.countries && shard.countries.includes(normalized)) {
          return shard;
        }
      }
    }
    return this.shards[this.defaultShard];
  },
};

// Export CommonJS compatible default as well
export default shardingConfig;
