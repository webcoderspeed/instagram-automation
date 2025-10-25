# Auto-DM Service API Documentation

## Overview
The Auto-DM (Automatic Direct Message) service provides intelligent automated responses to incoming Instagram messages. It analyzes incoming messages and triggers appropriate automated responses based on configured automations and message content.

## Base URL
```
/api/auto-dm
```

## Authentication
All Auto-DM endpoints require authentication and appropriate permissions. Include the session cookie or authentication token in your requests.

## Table of Contents
1. [Service Overview](#service-overview)
2. [Message Processing](#message-processing)
3. [Automation Matching](#automation-matching)
4. [Response Generation](#response-generation)
5. [Service Management](#service-management)
6. [Data Models](#data-models)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)

---

## Service Overview

### Key Features
- **Intelligent Message Processing**: Analyzes incoming Instagram messages for automated responses
- **Automation Matching**: Finds and executes matching automations based on message content
- **Platform Integration**: Seamlessly integrates with Instagram messaging API
- **Confidence Scoring**: Uses confidence scores to select the best matching automation
- **Error Handling**: Comprehensive error handling and logging for debugging

### Service Architecture
The Auto-DM service operates as a singleton service that:
1. Receives incoming message events from webhooks
2. Analyzes message content and context
3. Finds matching automations for the platform account
4. Executes the best matching automation
5. Sends automated responses back to the sender

---

## Message Processing

### Process Incoming Message
The core method for processing incoming messages and triggering auto-responses.

**Method:** `processIncomingMessage(message: IncomingMessage)`

**Parameters:**
```typescript
interface IncomingMessage {
  messageId: string;
  senderId: string;
  recipientId: string;
  platform: 'instagram' | 'facebook';
  text?: string;
  timestamp: Date;
  messageType: 'text' | 'image' | 'video' | 'audio';
  attachments?: MessageAttachment[];
}
```

**Response:**
```typescript
interface AutoDMResponse {
  success: boolean;
  message?: string;
  error?: string;
  automationId?: string;
  confidence?: number;
}
```

**Example Usage:**
```typescript
const message: IncomingMessage = {
  messageId: 'msg_123',
  senderId: 'user_456',
  recipientId: 'account_789',
  platform: 'instagram',
  text: 'Hello, I need help with my order',
  timestamp: new Date(),
  messageType: 'text'
};

const response = await autoDMService.processIncomingMessage(message);
```

---

## Automation Matching

### Find Matching Automations
The service finds automations that match the incoming message based on:
- **Trigger Type**: Must be `INSTAGRAM_MESSAGE_RECEIVED`
- **Platform Account**: Must match the recipient account
- **Message Content**: Analyzed against automation conditions
- **User Permissions**: User must have active subscription and permissions

### Matching Algorithm
1. **Platform Account Lookup**: Find the platform account for the recipient
2. **Automation Query**: Find active automations with message triggers
3. **Content Analysis**: Analyze message text against automation conditions
4. **Confidence Scoring**: Calculate confidence scores for each match
5. **Best Match Selection**: Select automation with highest confidence score

### Confidence Scoring
The service uses a confidence scoring system to determine the best automation match:
- **Exact Keyword Match**: 100% confidence
- **Partial Keyword Match**: 70-90% confidence
- **Semantic Similarity**: 50-70% confidence
- **Default Fallback**: 30% confidence

---

## Response Generation

### Send Reply Message
Generates and sends automated responses based on the matched automation.

**Features:**
- **Template Processing**: Processes message templates with dynamic variables
- **Personalization**: Includes sender name and context-specific information
- **Multi-format Support**: Supports text, images, and rich media responses
- **Rate Limiting**: Respects platform rate limits and sending quotas

**Message Templates:**
```typescript
interface MessageTemplate {
  type: 'text' | 'image' | 'video' | 'quick_reply' | 'button_template';
  content: string;
  variables?: Record<string, string>;
  attachments?: MessageAttachment[];
}
```

---

## Service Management

### Service Status
Get the current status and configuration of the Auto-DM service.

**Method:** `getStatus()`

**Response:**
```typescript
interface ServiceStatus {
  initialized: boolean;
  availableHandlers: string[];
  activeAutomations?: number;
  processedMessages?: number;
  lastActivity?: Date;
}
```

**Example Response:**
```json
{
  "initialized": true,
  "availableHandlers": [
    "instagram_messages",
    "facebook_messages",
    "message_reactions",
    "message_deliveries"
  ],
  "activeAutomations": 15,
  "processedMessages": 1247,
  "lastActivity": "2024-01-15T10:30:00Z"
}
```

---

## Data Models

### IncomingMessage
```typescript
interface IncomingMessage {
  messageId: string;           // Unique message identifier
  senderId: string;           // ID of the message sender
  recipientId: string;        // ID of the recipient (platform account)
  platform: 'instagram' | 'facebook';  // Platform where message was received
  text?: string;              // Message text content
  timestamp: Date;            // When the message was received
  messageType: 'text' | 'image' | 'video' | 'audio';  // Type of message
  attachments?: MessageAttachment[];  // Any attached media
}
```

### AutoDMResponse
```typescript
interface AutoDMResponse {
  success: boolean;           // Whether processing was successful
  message?: string;           // Success message or description
  error?: string;             // Error message if processing failed
  automationId?: string;      // ID of the automation that was triggered
  confidence?: number;        // Confidence score of the match (0-100)
  executionTime?: number;     // Time taken to process in milliseconds
}
```

### MessageAttachment
```typescript
interface MessageAttachment {
  type: 'image' | 'video' | 'audio' | 'file';
  url: string;
  mimeType?: string;
  size?: number;
  filename?: string;
}
```

---

## Error Handling

### Common Errors

#### Platform Account Not Found
```json
{
  "success": false,
  "error": "Platform account not found",
  "code": "PLATFORM_ACCOUNT_NOT_FOUND"
}
```

#### No Matching Automations
```json
{
  "success": false,
  "message": "No matching automations found",
  "code": "NO_MATCHING_AUTOMATIONS"
}
```

#### Service Not Initialized
```json
{
  "success": false,
  "error": "Auto DM service not initialized",
  "code": "SERVICE_NOT_INITIALIZED"
}
```

#### Execution Failed
```json
{
  "success": false,
  "error": "Failed to execute automation",
  "code": "EXECUTION_FAILED",
  "details": "Specific error details"
}
```

---

## Best Practices

### 1. Message Content Analysis
- **Keyword Optimization**: Use relevant keywords in automation conditions
- **Natural Language**: Design responses to sound natural and helpful
- **Context Awareness**: Consider the context of the conversation

### 2. Automation Configuration
- **Clear Triggers**: Define clear and specific trigger conditions
- **Fallback Responses**: Always include fallback responses for unmatched messages
- **Rate Limiting**: Respect platform rate limits and user experience

### 3. Response Quality
- **Personalization**: Use sender names and context-specific information
- **Helpful Content**: Provide genuinely helpful and relevant responses
- **Call-to-Action**: Include clear next steps or call-to-action

### 4. Monitoring and Analytics
- **Track Performance**: Monitor response rates and user engagement
- **A/B Testing**: Test different response templates and strategies
- **Continuous Improvement**: Regularly update and optimize automations

### 5. Compliance and Ethics
- **User Consent**: Ensure users have consented to automated responses
- **Transparency**: Be transparent about automated nature of responses
- **Privacy**: Respect user privacy and data protection regulations

---

## Integration Examples

### Webhook Integration
```typescript
// In webhook handler
import { autoDMService } from '../services/auto-dm/auto-dm.service';

export async function handleInstagramMessage(webhookData: any) {
  const message: IncomingMessage = {
    messageId: webhookData.message.mid,
    senderId: webhookData.sender.id,
    recipientId: webhookData.recipient.id,
    platform: 'instagram',
    text: webhookData.message.text,
    timestamp: new Date(webhookData.timestamp),
    messageType: 'text'
  };

  const response = await autoDMService.processIncomingMessage(message);
  
  if (response.success) {
    logger.info('Auto-DM response sent successfully', {
      automationId: response.automationId,
      confidence: response.confidence
    });
  } else {
    logger.warn('Auto-DM processing failed', {
      error: response.error
    });
  }
}
```

### Custom Automation Setup
```typescript
// Example automation for customer support
const supportAutomation = {
  name: 'Customer Support Auto-Response',
  trigger: {
    type: 'INSTAGRAM_MESSAGE_RECEIVED',
    config: {
      keywords: ['help', 'support', 'problem', 'issue'],
      matchType: 'contains'
    }
  },
  actions: [{
    type: 'SEND_MESSAGE',
    config: {
      template: 'Hello {{senderName}}! Thanks for reaching out. Our support team will get back to you within 24 hours. For urgent issues, please call our hotline.',
      variables: {
        senderName: '{{sender.name}}'
      }
    }
  }]
};
```

This documentation provides comprehensive coverage of the Auto-DM service functionality and usage patterns.