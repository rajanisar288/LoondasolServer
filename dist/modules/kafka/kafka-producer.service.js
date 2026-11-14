"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var KafkaProducerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KafkaProducerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const kafkajs_1 = require("kafkajs");
const kafka_constants_1 = require("./kafka.constants");
let KafkaProducerService = KafkaProducerService_1 = class KafkaProducerService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(KafkaProducerService_1.name);
        this.kafka = null;
        this.producer = null;
        this.isConnected = false;
    }
    async onModuleInit() {
        const rawBrokers = this.configService.get('KAFKA_BROKERS') || kafka_constants_1.KAFKA_CONFIG.DEFAULT_BROKER;
        const brokers = rawBrokers.split(',').map((broker) => broker.trim());
        try {
            this.kafka = new kafkajs_1.Kafka({
                clientId: kafka_constants_1.KAFKA_CONFIG.CLIENT_ID,
                brokers,
                logLevel: kafkajs_1.logLevel.NOTHING,
                retry: { retries: 3, initialRetryTime: 300 },
            });
            this.producer = this.kafka.producer({ allowAutoTopicCreation: true });
            await this.producer.connect();
            this.isConnected = true;
            this.logger.log(`Kafka Producer successfully connected to brokers [${brokers.join(', ')}]`);
        }
        catch (error) {
            this.isConnected = false;
            this.logger.warn(`Kafka broker offline at [${brokers.join(', ')}]. Operating in direct resilient mode.`);
        }
    }
    async onModuleDestroy() {
        if (this.producer && this.isConnected) {
            await this.producer.disconnect();
        }
    }
    isBrokerReady() {
        return this.isConnected && this.producer !== null;
    }
    async sendEvent(topic, messagePayload, key) {
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
        }
        catch (error) {
            this.logger.error(`Failed to publish event to topic ${topic}: ${error.message}`);
            return false;
        }
    }
    async queueEmail(payload) {
        return this.sendEvent(kafka_constants_1.KAFKA_TOPICS.EMAILS, payload, payload.to);
    }
    async queueNotification(payload) {
        return this.sendEvent(kafka_constants_1.KAFKA_TOPICS.NOTIFICATIONS, payload, payload.userId);
    }
};
exports.KafkaProducerService = KafkaProducerService;
exports.KafkaProducerService = KafkaProducerService = KafkaProducerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], KafkaProducerService);
//# sourceMappingURL=kafka-producer.service.js.map