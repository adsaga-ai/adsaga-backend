require('dotenv').config();
const { testEmailConnection, sendEmail } = require('./src/utils/email-service-sendgrid');

async function testSendGrid() {
  console.log('=== SendGrid Configuration Test ===');
  
  // Check environment variables
  console.log('\n1. Environment Variables:');
  console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? 'Set' : 'Missing');
  console.log('SENDGRID_FROM_EMAIL:', process.env.SENDGRID_FROM_EMAIL || 'Not set');
  console.log('EMAIL_USER:', process.env.EMAIL_USER || 'Not set');
  
  // Test connection
  console.log('\n2. Testing SendGrid Connection:');
  const connectionTest = await testEmailConnection();
  console.log('Connection test result:', connectionTest ? 'PASSED' : 'FAILED');
  
  if (connectionTest) {
    console.log('\n3. Testing Email Send:');
    try {
      const result = await sendEmail({
        to: 'test@example.com', // Change this to a real email for testing
        subject: 'Test Email from AdSaga',
        html: '<h1>Test Email</h1><p>This is a test email from AdSaga using SendGrid.</p>',
        text: 'Test Email - This is a test email from AdSaga using SendGrid.'
      });
      console.log('Email send result:', result ? 'SUCCESS' : 'FAILED');
      if (result) {
        console.log('Message ID:', result[0]?.headers?.['x-message-id'] || 'Unknown');
      }
    } catch (error) {
      console.error('Email send failed:', error.message);
    }
  }
  
  console.log('\n=== Test Complete ===');
}

testSendGrid().catch(console.error);
