import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, logLevel } from 'kafkajs';
import { KAFKA_CONFIG, KAFKA_TOPICS } from './kafka.constants';

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

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);
  private kafka: Kafka | null = null;
  private producer: Producer | null = null;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {}

  // onModuleInit: initializes Kafka broker client and connects producer
  async onModuleInit(): Promise<void> {
    const rawBrokers = this.configService.get<string>('KAFKA_BROKERS') || KAFKA_CONFIG.DEFAULT_BROKER;
    const brokers = rawBrokers.split(',').map((broker) => broker.trim());
    try {
      this.kafka = new Kafka({
        clientId: KAFKA_CONFIG.CLIENT_ID,
        brokers,
        logLevel: logLevel.NOTHING,
        retry: { retries: 3, initialRetryTime: 300 },
      });
      this.producer = this.kafka.producer({ allowAutoTopicCreation: true });
      await this.producer.connect();
      this.isConnected = true;
      this.logger.log(`Kafka Producer successfully connected to brokers [${brokers.join(', ')}]`);
    } catch (error) {
      this.isConnected = false;
      this.logger.warn(`Kafka broker offline at [${brokers.join(', ')}]. Operating in direct resilient mode.`);
    }
  }

  // onModuleDestroy: gracefully disconnects producer on shutdown
  async onModuleDestroy(): Promise<void> {
    if (this.producer && this.isConnected) {
      await this.producer.disconnect();
    }
  }

  // isBrokerReady: indicates whether Kafka broker connection is established
  isBrokerReady(): boolean {
    return this.isConnected && this.producer !== null;
  }

  // sendEvent: publishes a serialized event message to target Kafka topic
  async sendEvent(topic: string, messagePayload: unknown, key?: string): Promise<boolean> {
    if (!this.isConnected || !this.producer) {
      return false;
    }
    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: key || undefined,
            value: JSON.stringify(messagePayload),
            timestamp: Date.now().toString(),
          },
        ],
      });
      return true;
    } catch (error) {
      this.logger.error(`Failed to publish event to topic ${topic}: ${(error as Error).message}`);
      return false;
    }
  }

  // queueEmail: dispatches email notification payload to emails topic
  async queueEmail(payload: KafkaEmailPayload): Promise<boolean> {
    return this.sendEvent(KAFKA_TOPICS.EMAILS, payload, payload.to);
  }

  // queueNotification: dispatches notification payload to notifications topic
  async queueNotification(payload: KafkaNotificationPayload): Promise<boolean> {
    return this.sendEvent(KAFKA_TOPICS.NOTIFICATIONS, payload, payload.userId);
  }
}

