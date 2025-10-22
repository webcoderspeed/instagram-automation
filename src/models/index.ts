/**
 * Models Index
 * Central export for all database models
 */

// Base model exports
export * from './base.model';

// Core models
export * from './user.model';
export * from './platform-account.model';
export * from './post.model';
export * from './campaign.model';

// SaaS Platform models
export * from './automation.model';
export * from './analytics.model';
export * from './subscription.model';
export * from './payment-history.model';
export * from './notification.model';

// TODO: Add these models when they are created
// export * from './message.model';
// export * from './template.model';
// export * from './webhook.model';
// export * from './file.model';
// export * from './audit-log.model';