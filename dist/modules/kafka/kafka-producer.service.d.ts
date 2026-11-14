import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export interface KafkaEmailPayload {
    to: string;
    subject: string;
    html: string;
    companyId?: string;
}
export interface KafkaNotificationPayload {
    userId: string;
    title: string;
    message: string;
    type: string;
    companyId: string;
    region: string;
    data?: Record<string, unknown>;
}
export declare class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    private kafka;
    private producer;
    private isConnected;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    isBrokerReady(): boolean;
    sendEvent(topic: string, messagePayload: unknown, key?: string): Promise<boolean>;
    queueEmail(payload: KafkaEmailPayload): Promise<boolean>;
    queueNotification(payload: KafkaNotificationPayload): Promise<boolean>;
}
