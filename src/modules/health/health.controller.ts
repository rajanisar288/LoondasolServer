import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Public } from '../../common/decorators/public.decorator';
import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import { RedisService } from '../../database/redis.service';
import { REGIONS } from '../../common/constants/regions.constant';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    @InjectConnection()
    private readonly masterConnection: Connection,
    private readonly regionalDbManager: RegionalDatabaseManager,
    private readonly redisService: RedisService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'System health check for databases and services' })
  async check(): Promise<Record<string, unknown>> {
    const masterStatus =
      Number(this.masterConnection.readyState) === 1
        ? 'connected'
        : 'disconnected';

    let pkStatus = 'unknown';
    try {
      const conn = await this.regionalDbManager.getConnection(REGIONS.PK);
      pkStatus = Number(conn.readyState) === 1 ? 'connected' : 'disconnected';
    } catch {
      pkStatus = 'failed';
    }

    const redisClient = this.redisService.getClient();
    const redisStatus =
      redisClient?.status === 'ready' || redisClient?.status === 'connect'
        ? 'connected'
        : 'bypassed';

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      databases: {
        master: masterStatus,
        regional_pk: pkStatus,
      },
      services: {
        redis: redisStatus,
      },
      uptime: process.uptime(),
    };
  }
}
