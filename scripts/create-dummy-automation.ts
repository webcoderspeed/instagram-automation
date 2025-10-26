/**
 * Create Dummy Automation Script
 * Creates a sample auto-reply automation that responds with "Hi from AI" when someone sends "hello"
 */

import mongoose from 'mongoose';
import { AutomationModel, AutomationType, AutomationStatus } from '../src/models/automation.model';
import { UserModel } from '../src/models/user.model';
import logger from '../src/utils/logger';

// Database connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/postengage';
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const createDummyAutomation = async () => {
  try {
    // Find the first user (you can modify this to use a specific user)
    const user = await UserModel.findOne({}).select('_id email username');
    
    if (!user) {
      logger.error('No user found. Please create a user first.');
      return;
    }

    logger.info(`Creating automation for user: ${user.email} (${user.username})`);

    // Create the dummy automation
    const automation = new AutomationModel({
      name: 'Hello Auto-Reply',
      description: 'Responds with "Hi from AI" when someone sends a message containing "hello"',
      type: AutomationType.AUTO_REPLY,
      status: AutomationStatus.ACTIVE,
      userId: user._id,
      platformAccounts: [], // Will work for all connected accounts
      config: {
        triggers: [
          {
            type: 'event',
            event: {
              eventType: 'message_received',
              conditions: {
                keywords: ['hello', 'hi', 'hey', 'Hello', 'Hi', 'Hey']
              }
            }
          }
        ],
        actions: [
          {
            type: 'send_reply',
            platform: 'instagram',
            config: {
              message: 'Hi from AI! 👋 Thanks for reaching out. How can I help you today?',
              delay: 2000, // 2 second delay
              personalized: true
            }
          }
        ]
      },
      executionCount: 0,
      successCount: 0,
      failureCount: 0,
      analytics: {
        totalRuns: 0,
        successRate: 0,
        avgExecutionTime: 0,
        errorCount: 0
      },
      tags: ['auto-reply', 'greeting', 'demo'],
      metadata: {
        createdBy: 'script',
        purpose: 'demo',
        version: '1.0'
      }
    });

    const savedAutomation = await automation.save();
    
    logger.info('✅ Dummy automation created successfully!');
    logger.info(`Automation ID: ${savedAutomation._id}`);
    logger.info(`Name: ${savedAutomation.name}`);
    logger.info(`Status: ${savedAutomation.status}`);
    logger.info(`User: ${user.email}`);
    
    console.log('\n🎉 Automation Details:');
    console.log(`- Name: ${savedAutomation.name}`);
    console.log(`- Description: ${savedAutomation.description}`);
    console.log(`- Type: ${savedAutomation.type}`);
    console.log(`- Status: ${savedAutomation.status}`);
    console.log(`- Triggers: Message containing keywords: ${savedAutomation.config.triggers[0].event?.conditions?.keywords?.join(', ')}`);
    console.log(`- Response: "${savedAutomation.config.actions[0].config.message}"`);
    console.log(`- User: ${user.email} (${user.username})`);
    
    return savedAutomation;

  } catch (error) {
    logger.error('Error creating dummy automation:', error);
    throw error;
  }
};

const main = async () => {
  try {
    await connectDB();
    await createDummyAutomation();
    
    logger.info('Script completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Script failed:', error);
    process.exit(1);
  }
};

// Run the script
if (require.main === module) {
  main();
}

export { createDummyAutomation };