const sgMail = require('@sendgrid/mail');
const config = require('../config/development');

/**
 * Initialize SendGrid mail service
 */
function initializeSendGrid() {
  if (config.email.sendgrid && config.email.sendgrid.apiKey) {
    sgMail.setApiKey(config.email.sendgrid.apiKey);
    return true;
  }
  return false;
}

/**
 * Test SendGrid connection
 * @returns {Promise<boolean>} Connection test result
 */
async function testEmailConnection() {
  try {
    const isInitialized = initializeSendGrid();
    if (!isInitialized) {
      console.error('SendGrid not initialized - check SENDGRID_API_KEY environment variable');
      return false;
    }
    
    console.log('Testing SendGrid connection with:', {
      fromEmail: config.email.sendgrid.fromEmail,
      hasApiKey: !!config.email.sendgrid.apiKey
    });
    
    // Test with a simple API call
    await sgMail.send({
      to: 'test@example.com',
      from: config.email.sendgrid.fromEmail,
      subject: 'Test Connection',
      text: 'Test email to verify SendGrid connection',
      html: '<p>Test email to verify SendGrid connection</p>'
    });
    
    return true;
  } catch (error) {
    console.error('SendGrid connection test failed:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      body: error.response?.body
    });
    
    // For testing purposes, we'll return true if the API key is valid
    // even if the test email fails (since test@example.com might not be valid)
    if (error.response && error.response.status === 400) {
      return true; // API key is valid, just bad recipient
    }
    return false;
  }
}

/**
 * Send email using SendGrid
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {Function} options.template - Template function to generate HTML
 * @param {Object} options.templateData - Data to pass to template function
 * @param {string} options.text - Email text content (optional)
 * @returns {Promise<Object>} Email send result
 */
async function sendEmail(options) {
  try {
    const isInitialized = initializeSendGrid();
    if (!isInitialized) {
      throw new Error('SendGrid API key not configured');
    }
    
    // Debug: Log configuration details (without exposing the actual API key)
    console.log('SendGrid Configuration:', {
      hasApiKey: !!config.email.sendgrid.apiKey,
      fromEmail: config.email.sendgrid.fromEmail,
      apiKeyLength: config.email.sendgrid.apiKey?.length || 0,
      apiKeyPrefix: config.email.sendgrid.apiKey?.substring(0, 5) || 'N/A'
    });
    
    // Generate HTML content using template and data
    const htmlContent = options.template ? options.template(options.templateData) : options.html;
    
    const msg = {
      to: options.to,
      from: {
        email: config.email.sendgrid.fromEmail,
        name: process.env.EMAIL_FROM_NAME || 'AdSaga'
      },
      subject: options.subject,
      text: options.text,
      html: htmlContent
    };

    const result = await sgMail.send(msg);
    return result;
  } catch (error) {
    // Enhanced error logging for debugging
    console.error('SendGrid Error Details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      body: error.response?.body,
      errors: error.response?.body?.errors,
      headers: error.response?.headers
    });
    
    // Log the actual error details from SendGrid
    if (error.response?.body?.errors) {
      console.error('SendGrid API Errors:', JSON.stringify(error.response.body.errors, null, 2));
    }
    
    // Provide more specific error messages
    if (error.response?.status === 401) {
      throw new Error('SendGrid API key is invalid or missing');
    } else if (error.response?.status === 403) {
      throw new Error('SendGrid API key does not have required permissions or from email is not verified');
    } else if (error.response?.status === 400) {
      throw new Error(`SendGrid request validation failed: ${error.response?.body?.errors?.[0]?.message || error.message}`);
    } else if (error.message === 'Forbidden') {
      // Handle the specific "Forbidden" error we're seeing
      const errorDetails = error.response?.body?.errors?.[0];
      if (errorDetails) {
        throw new Error(`SendGrid Forbidden: ${errorDetails.message || 'API key or sender verification issue'}`);
      } else {
        throw new Error('SendGrid Forbidden: Check API key permissions and sender verification');
      }
    } else {
      throw new Error(`Failed to send email via SendGrid: ${error.message}`);
    }
  }
}

module.exports = {
  testEmailConnection,
  sendEmail
};
