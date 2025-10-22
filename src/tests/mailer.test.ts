/**
 * Mailer Service Tests
 * Test file for email functionality using nodemailer
 */

import { mailerService, EmailOptions } from '../services/mailer.service';
import env from '../config/env.config';

/**
 * Test SMTP connection
 */
async function testConnection() {
  console.log('🔍 Testing SMTP connection...');
  
  const status = mailerService.getStatus();
  console.log('📊 Mailer Status:', status);
  
  if (!status.configured) {
    console.log('⚠️  SMTP not configured. Please set environment variables:');
    console.log('   - SMTP_HOST');
    console.log('   - SMTP_PORT');
    console.log('   - SMTP_USER');
    console.log('   - SMTP_PASS');
    console.log('   - EMAIL_FROM');
    console.log('   - EMAIL_FROM_NAME');
    return false;
  }
  
  const isConnected = await mailerService.verifyConnection();
  
  if (isConnected) {
    console.log('✅ SMTP connection verified successfully!');
  } else {
    console.log('❌ SMTP connection failed!');
  }
  
  return isConnected;
}

/**
 * Test basic email sending
 */
async function testBasicEmail() {
  console.log('\n📧 Testing basic email sending...');
  
  const testEmail: EmailOptions = {
    to: env.SMTP_USER || 'test@example.com', // Send to self for testing
    subject: 'Test Email from Instagram Automation',
    text: 'This is a test email to verify the mailer service is working correctly.',
    html: `
      <h2>Test Email</h2>
      <p>This is a test email to verify the mailer service is working correctly.</p>
      <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      <p><em>Sent from Instagram Automation Mailer Service</em></p>
    `,
  };
  
  const success = await mailerService.sendEmail(testEmail);
  
  if (success) {
    console.log('✅ Basic email sent successfully!');
  } else {
    console.log('❌ Failed to send basic email!');
  }
  
  return success;
}

/**
 * Test welcome email template
 */
async function testWelcomeEmail() {
  console.log('\n🎉 Testing welcome email template...');
  
  const success = await mailerService.sendWelcomeEmail(
    env.SMTP_USER || 'test@example.com', // Send to self for testing
    'Test User'
  );
  
  if (success) {
    console.log('✅ Welcome email sent successfully!');
  } else {
    console.log('❌ Failed to send welcome email!');
  }
  
  return success;
}

/**
 * Test verification email template
 */
async function testVerificationEmail() {
  console.log('\n🔐 Testing verification email template...');
  
  const testToken = 'test-verification-token-' + Date.now();
  
  const success = await mailerService.sendVerificationEmail(
    env.SMTP_USER || 'test@example.com', // Send to self for testing
    'Test User',
    testToken
  );
  
  if (success) {
    console.log('✅ Verification email sent successfully!');
  } else {
    console.log('❌ Failed to send verification email!');
  }
  
  return success;
}

/**
 * Test password reset email template
 */
async function testPasswordResetEmail() {
  console.log('\n🔑 Testing password reset email template...');
  
  const testToken = 'test-reset-token-' + Date.now();
  
  const success = await mailerService.sendPasswordResetEmail(
    env.SMTP_USER || 'test@example.com', // Send to self for testing
    'Test User',
    testToken
  );
  
  if (success) {
    console.log('✅ Password reset email sent successfully!');
  } else {
    console.log('❌ Failed to send password reset email!');
  }
  
  return success;
}

/**
 * Test notification email
 */
async function testNotificationEmail() {
  console.log('\n🔔 Testing notification email...');
  
  const success = await mailerService.sendNotificationEmail(
    env.SMTP_USER || 'test@example.com', // Send to self for testing
    'Test Notification',
    'This is a test notification message.\n\nIt includes multiple lines\nand should be formatted correctly in the email.'
  );
  
  if (success) {
    console.log('✅ Notification email sent successfully!');
  } else {
    console.log('❌ Failed to send notification email!');
  }
  
  return success;
}

/**
 * Test email with attachments
 */
async function testEmailWithAttachments() {
  console.log('\n📎 Testing email with attachments...');
  
  const testEmail: EmailOptions = {
    to: env.SMTP_USER || 'test@example.com',
    subject: 'Test Email with Attachments',
    text: 'This email contains test attachments.',
    html: '<h2>Test Email with Attachments</h2><p>This email contains test attachments.</p>',
    attachments: [
      {
        filename: 'test.txt',
        content: 'This is a test attachment file.\nGenerated at: ' + new Date().toISOString(),
        contentType: 'text/plain',
      },
      {
        filename: 'test.json',
        content: JSON.stringify({
          message: 'Test JSON attachment',
          timestamp: new Date().toISOString(),
          service: 'Instagram Automation Mailer',
        }, null, 2),
        contentType: 'application/json',
      },
    ],
  };
  
  const success = await mailerService.sendEmail(testEmail);
  
  if (success) {
    console.log('✅ Email with attachments sent successfully!');
  } else {
    console.log('❌ Failed to send email with attachments!');
  }
  
  return success;
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting Mailer Service Tests\n');
  console.log('=' .repeat(50));
  
  const results = {
    connection: false,
    basicEmail: false,
    welcomeEmail: false,
    verificationEmail: false,
    passwordResetEmail: false,
    notificationEmail: false,
    attachmentEmail: false,
  };
  
  try {
    // Test connection first
    results.connection = await testConnection();
    
    if (!results.connection) {
      console.log('\n❌ SMTP connection failed. Skipping email tests.');
      return results;
    }
    
    // Run email tests
    results.basicEmail = await testBasicEmail();
    results.welcomeEmail = await testWelcomeEmail();
    results.verificationEmail = await testVerificationEmail();
    results.passwordResetEmail = await testPasswordResetEmail();
    results.notificationEmail = await testNotificationEmail();
    results.attachmentEmail = await testEmailWithAttachments();
    
  } catch (error) {
    console.error('\n💥 Test execution failed:', error);
  }
  
  // Print summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 Test Results Summary:');
  console.log('=' .repeat(50));
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`${test.padEnd(20)}: ${status}`);
  });
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  console.log('\n📈 Overall Results:');
  console.log(`   Passed: ${passedTests}/${totalTests}`);
  console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Mailer service is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the configuration and logs.');
  }
  
  return results;
}

// Export for use in other test files
export {
  testConnection,
  testBasicEmail,
  testWelcomeEmail,
  testVerificationEmail,
  testPasswordResetEmail,
  testNotificationEmail,
  testEmailWithAttachments,
  runAllTests,
};

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests()
    .then(() => {
      console.log('\n✨ Test execution completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test execution failed:', error);
      process.exit(1);
    });
}