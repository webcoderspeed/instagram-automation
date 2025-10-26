/**
 * Auto DM Service Test
 * Simple test to verify auto-DM functionality
 */

import { autoDMService, IncomingMessage } from '../services/auto-dm';
import logger from '../utils/logger';

// Mock incoming message for testing
const mockIncomingMessage: IncomingMessage = {
  senderId: 'test_sender_123',
  recipientId: 'test_recipient_456',
  text: 'hello support',
  messageId: 'test_msg_789',
  platform: 'instagram',
  timestamp: new Date(),
  entryId: 'test_entry_101'
};

/**
 * Test auto-DM processing
 */
async function testAutoDM() {
  try {
    logger.info('Starting auto-DM test');
    
    // Test the auto-DM service
    const result = await autoDMService.processIncomingMessage(mockIncomingMessage);
    
    logger.info('Auto-DM test result:', {
      success: result.success,
      message: result.message,
      error: result.error,
      automationId: result.automationId,
      responseText: result.responseText?.substring(0, 100) + '...'
    });
    
    if (result.success) {
      logger.info('✅ Auto-DM test passed - automation triggered successfully');
    } else {
      logger.info('ℹ️ Auto-DM test completed - no automation triggered (expected if no matching automations exist)');
    }
    
  } catch (error) {
    logger.error('❌ Auto-DM test failed:', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Test service status
 */
function testServiceStatus() {
  try {
    const status = autoDMService.getStatus();
    logger.info('Auto-DM service status:', status);
    
    if (status.initialized) {
      logger.info('✅ Auto-DM service is properly initialized');
    } else {
      logger.error('❌ Auto-DM service is not initialized');
    }
  } catch (error) {
    logger.error('❌ Failed to get service status:', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Run tests
async function runTests() {
  logger.info('🚀 Starting Auto-DM functionality tests');
  
  // Test 1: Service status
  logger.info('\n📋 Test 1: Service Status');
  testServiceStatus();
  
  // Test 2: Auto-DM processing
  logger.info('\n📋 Test 2: Auto-DM Processing');
  await testAutoDM();
  
  logger.info('\n✨ Auto-DM tests completed');
}

// Export for use in other test files
export { testAutoDM, testServiceStatus, runTests };

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(error => {
    logger.error('Test execution failed:', error);
    process.exit(1);
  });
}