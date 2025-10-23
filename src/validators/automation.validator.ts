import { z } from 'zod';

// Automation type enum
const AutomationType = z.enum([
  'post_scheduling',
  'auto_reply', 
  'follow_unfollow',
  'engagement',
  'story_posting',
  'dm_automation'
]);

// Trigger schema
const TriggerSchema = z.object({
  type: z.enum(['time_based', 'event_based', 'condition_based']),
  config: z.record(z.string(), z.unknown()),
});

// Action schema
const ActionSchema = z.object({
  type: z.enum(['post', 'story', 'comment', 'like', 'follow', 'unfollow', 'dm', 'delay']),
  config: z.record(z.string(), z.unknown()),
  order: z.number().int().min(0),
});

// Time slot schema
const TimeSlotSchema = z.object({
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
});

// Frequency schema
const FrequencySchema = z.object({
  type: z.enum(['once', 'daily', 'weekly', 'monthly', 'custom']),
  interval: z.number().int().min(1).optional(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  timeSlots: z.array(TimeSlotSchema).optional(),
});

// Schedule schema
const ScheduleSchema = z.object({
  timezone: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  frequency: FrequencySchema,
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) > new Date(data.startDate);
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["endDate"],
});

// Condition schema
const ConditionSchema = z.object({
  type: z.enum(['account_metrics', 'post_performance', 'time_window', 'user_activity']),
  operator: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'not_contains']),
  value: z.union([z.string(), z.number(), z.boolean()]),
});

// Settings schema
const SettingsSchema = z.object({
  isActive: z.boolean().default(true),
  maxExecutions: z.number().int().min(1).optional(),
  cooldownPeriod: z.number().int().min(0).optional(),
  retryAttempts: z.number().int().min(0).max(5).default(3),
  notifications: z.object({
    onSuccess: z.boolean().default(false),
    onFailure: z.boolean().default(true),
    onComplete: z.boolean().default(false),
  }).optional(),
});

// Create automation schema
export const createAutomationSchema = z.object({
  name: z.string()
    .trim()
    .min(3, "Automation name must be at least 3 characters long")
    .max(100, "Automation name cannot exceed 100 characters"),
  
  description: z.string()
    .trim()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
  
  type: AutomationType,
  
  triggers: z.array(TriggerSchema)
    .min(1, "At least one trigger is required"),
  
  actions: z.array(ActionSchema)
    .min(1, "At least one action is required"),
  
  schedule: ScheduleSchema.optional(),
  
  conditions: z.array(ConditionSchema).optional(),
  
  settings: SettingsSchema.optional(),
  
  tags: z.array(
    z.string().trim().min(1).max(50)
  ).max(10, "Maximum 10 tags allowed").optional(),
});

// Update automation schema
export const updateAutomationSchema = z.object({
  name: z.string()
    .trim()
    .min(3, "Automation name must be at least 3 characters long")
    .max(100, "Automation name cannot exceed 100 characters")
    .optional(),
  
  description: z.string()
    .trim()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
  
  type: AutomationType.optional(),
  
  triggers: z.array(TriggerSchema)
    .min(1, "At least one trigger is required")
    .optional(),
  
  actions: z.array(ActionSchema)
    .min(1, "At least one action is required")
    .optional(),
  
  schedule: ScheduleSchema.optional(),
  
  conditions: z.array(ConditionSchema).optional(),
  
  settings: SettingsSchema.optional(),
  
  tags: z.array(
    z.string().trim().min(1).max(50)
  ).max(10, "Maximum 10 tags allowed").optional(),
});

// Export types
export type CreateAutomationInput = z.infer<typeof createAutomationSchema>;
export type UpdateAutomationInput = z.infer<typeof updateAutomationSchema>;