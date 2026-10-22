import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Connection, createConnection, Model, Schema } from 'mongoose';
import {
  shardingConfig,
  ShardConfig,
} from '../config/sharding.config';

@Injectable()
export class RegionalDatabaseManager implements OnApplicationShutdown {
  private readonly logger = new Logger(RegionalDatabaseManager.name);
  private readonly connections = new Map<string, Connection>();
  private readonly models = new Map<string, Model<unknown>>();

  constructor(private readonly configService: ConfigService) {}

  /**
   * Resolves or initializes the pooled MongoDB connection for the specified shard or country
   */
  async getConnection(regionOrShard?: string): Promise<Connection> {
    const shard = shardingConfig.getShardForCountry(regionOrShard);
    const targetKey = shard.name; // 'shard-1' | 'shard-2'

    if (this.connections.has(targetKey)) {
      const existing = this.connections.get(targetKey)!;
      if (Number(existing.readyState) === 1) {
        return existing;
      }
    }

    const uri = this.resolveShardUri(shard);
    this.logger.log(
      `Connecting to database shard [${shard.name}] (resolved from '${regionOrShard || 'default'}', countries: ${shard.countries.slice(0, 5).join(',')}) at ${this.maskUri(uri)}`,
    );

    try {
      const connection = createConnection(uri, {
        maxPoolSize: 50,
        minPoolSize: 5,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      // Wait for initial connection ready state
      await connection.asPromise();

      connection.on('error', (err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Database shard error on [${targetKey}]: ${msg}`);
      });

      connection.on('disconnected', () => {
        this.logger.warn(`Database shard [${targetKey}] disconnected`);
      });

      connection.on('reconnected', () => {
        this.logger.log(`Database shard [${targetKey}] reconnected`);
      });

      this.connections.set(targetKey, connection);
      return connection;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to connect to database shard [${targetKey}]: ${message}`,
      );

      // Fallback to default shard connection if not already trying default
      const defaultShard = shardingConfig.shards[shardingConfig.defaultShard];
      if (
        targetKey !== defaultShard.name &&
        this.connections.has(defaultShard.name)
      ) {
        this.logger.warn(
          `Falling back to default shard [${defaultShard.name}] for [${targetKey}]`,
        );
        return this.connections.get(defaultShard.name)!;
      }

      throw error;
    }
  }

  /**
   * Returns a typed Mongoose model bound to the resolved database shard
   */
  async getModel<T>(
    regionOrShard: string,
    modelName: string,
    schema: Schema,
  ): Promise<Model<T>> {
    const shard = shardingConfig.getShardForCountry(regionOrShard);
    const cacheKey = `${shard.name}:${modelName}`;

    if (this.models.has(cacheKey)) {
      return this.models.get(cacheKey) as unknown as Model<T>;
    }

    const connection = await this.getConnection(shard.name);
    // Use untyped registration to avoid Mongoose 8 deep type recursion during compilation
    const model = (connection.models[modelName] ||
      connection.model(modelName, schema)) as unknown as Model<T>;
    this.models.set(cacheKey, model as unknown as Model<unknown>);

    return model;
  }

  /**
   * Resolves the environment URI for the requested shard
   */
  private resolveShardUri(shard: ShardConfig): string {
    if (shard.name === 'shard-1') {
      const envUri =
        this.configService.get<string>('MONGODB_SHARD1_URI') ||
        process.env.MONGODB_SHARD1_URI;
      if (envUri && envUri.trim().length > 0) return envUri;
    }

    if (shard.name === 'shard-2') {
      const envUri =
        this.configService.get<string>('MONGODB_SHARD2_URI') ||
        process.env.MONGODB_SHARD2_URI;
      if (envUri && envUri.trim().length > 0) return envUri;
    }

    if (shard.uri && shard.uri.trim().length > 0) {
      return shard.uri;
    }

    // Default fallback to master URI with shard database suffix
    const masterUri =
      this.configService.get<string>('MONGODB_MASTER_URI') ||
      'mongodb+srv://ibsolangi444_db_user:jCX8cZ43BC30akBY@cluster0.rrpbdiu.mongodb.net/workivlab_master?retryWrites=true&w=majority';
    return masterUri.replace(
      /\/[^/?]+(\?|$)/,
      `/workivlab_${shard.name.replace('-', '_')}$1`,
    );
  }

  /**
   * Masks database credentials when logging connection strings
   */
  private maskUri(uri: string): string {
    return uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
  }

  /**
   * Safely shuts down all shard connections when the application terminates
   */
  async onApplicationShutdown(): Promise<void> {
    this.logger.log('Closing all sharded database connection pools...');
    for (const [shardKey, conn] of this.connections.entries()) {
      try {
        await conn.close();
        this.logger.log(`Closed database connection for [${shardKey}]`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `Error closing database connection for [${shardKey}]: ${message}`,
        );
      }
    }
    this.connections.clear();
    this.models.clear();
  }
}
