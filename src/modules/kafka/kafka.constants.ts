// KAFKA_TOPICS: Defines standard event streaming topics for production message delivery
export const KAFKA_TOPICS = {
  EMAILS: 'workivlab.company.emails',
  NOTIFICATIONS: 'workivlab.company.notifications',
  AUDIT_LOGS: 'workivlab.company.audit-logs',
  CHAT_MESSAGES: 'workivlab.company.chat-messages',
} as const;

// KAFKA_CONFIG: Holds default broker connection options and consumer group identifier
export const KAFKA_CONFIG = {
  CLIENT_ID: 'workivlab-producer',
  GROUP_ID: 'workivlab-event-consumers',
  DEFAULT_BROKER: 'localhost:9092',
} as const;

