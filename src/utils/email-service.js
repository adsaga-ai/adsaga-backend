const nodemailer = require('nodemailer');
const config = require('../config/development');


// Create transporter instance
let transporter = null;

/**
 * Initialize email transporter
 */
function initializeTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: config.email.auth
    });
  }
  return transporter;
}

/**
 * Test email connection
 * @returns {Promise<boolean>} Connection test result
 */
async function testEmailConnection() {
  try {
    const transporter = initializeTransporter();
    await transporter.verify();
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Send email using template and data
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
    const transporter = initializeTransporter();
    
    // Generate HTML content using template and data
    const htmlContent = options.template ? options.template(options.templateData) : options.html;
    
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'AdSaga'}" <${config.email.auth.user}>`,
      to: options.to,
      subject: options.subject,
      html: htmlContent,
      text: options.text
    };

    const result = await transporter.sendMail(mailOptions);
    return result;
  } catch (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

module.exports = {
  testEmailConnection,
  sendEmail
};
