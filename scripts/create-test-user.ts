import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserModel } from '../src/models/user.model';
import { logger } from '../src/utils/logger';
import { config } from '../src/config/config';

const createTestUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.database.uri);
    logger.info('Connected to MongoDB');

    // Check if test user already exists
    const existingUser = await UserModel.findOne({ email: 'test@example.com' });
    
    if (existingUser) {
      logger.info('Test user already exists:');
      logger.info(`Email: test@example.com`);
      logger.info(`Password: password123`);
      logger.info(`Username: testuser`);
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash('password123', 12);

    // Create test user
    const testUser = new UserModel({
      email: 'test@example.com',
      username: 'testuser',
      passwordHash,
      firstName: 'Test',
      lastName: 'User',
      displayName: 'Test User',
      timezone: 'UTC',
      language: 'en',
      isEmailVerified: true, // Skip email verification for test user
      role: 'user',
      permissions: ['USER_READ', 'USER_WRITE', 'AUTOMATION_READ', 'AUTOMATION_WRITE']
    });

    await testUser.save();

    logger.info('Test user created successfully!');
    logger.info('Login credentials:');
    logger.info(`Email: test@example.com`);
    logger.info(`Password: password123`);
    logger.info(`Username: testuser`);

  } catch (error) {
    logger.error('Error creating test user:', error);
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
};

// Run the script
createTestUser().catch(console.error);