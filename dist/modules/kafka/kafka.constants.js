"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KAFKA_CONFIG = exports.KAFKA_TOPICS = void 0;
exports.KAFKA_TOPICS = {
    EMAILS: 'workivlab.company.emails',
    NOTIFICATIONS: 'workivlab.company.notifications',
    AUDIT_LOGS: 'workivlab.company.audit-logs',
    CHAT_MESSAGES: 'workivlab.company.chat-messages',
};
exports.KAFKA_CONFIG = {
    CLIENT_ID: 'workivlab-producer',
    GROUP_ID: 'workivlab-event-consumers',
    DEFAULT_BROKER: 'localhost:9092',
};
//# sourceMappingURL=kafka.constants.js.map