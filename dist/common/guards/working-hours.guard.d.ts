import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RegionalDatabaseManager } from '../../database/regional-database.manager';
export declare class WorkingHoursGuard implements CanActivate {
    private readonly reflector;
    private readonly regionalDbManager;
    constructor(reflector: Reflector, regionalDbManager: RegionalDatabaseManager);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
