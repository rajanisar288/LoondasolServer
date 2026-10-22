import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { RegionalDatabaseManager } from './regional-database.manager';
import { MasterIdentity, MasterIdentitySchema } from './master.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_MASTER_URI'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: MasterIdentity.name, schema: MasterIdentitySchema },
    ]),
  ],
  providers: [RegionalDatabaseManager],
  exports: [RegionalDatabaseManager, MongooseModule],
})
export class DatabaseModule {}
