module.exports = function passwordResetEmailTemplate(fullname, resetUrl, email) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset - AdSaga</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #4f46e5;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background-color: #f9fafb;
          padding: 30px;
          border-radius: 0 0 8px 8px;
        }
        .button {
          display: inline-block;
          background-color: #4f46e5;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
        }
        .button:hover {
          background-color: #4338ca;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          font-size: 14px;
          color: #6b7280;
        }
        .warning {
          background-color: #fef3c7;
          border: 1px solid #f59e0b;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>AdSaga</h1>
        <h2>Password Reset Request</h2>
      </div>
      
      <div class="content">
        <p>Hello ${fullname},</p>
        
        <p>We received a request to reset your password for your AdSaga account. If you made this request, please click the button below to reset your password:</p>
        
        <div style="text-align: center;">
          <a href="${resetUrl}" class="button">Reset My Password</a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background-color: #e5e7eb; padding: 10px; border-radius: 4px;">${resetUrl}</p>
        
        <div class="warning">
          <strong>Security Notice:</strong>
          <ul>
            <li>This link will expire in 1 hour for security reasons</li>
            <li>If you didn't request this password reset, please ignore this email</li>
            <li>Your password will not be changed until you click the link above</li>
          </ul>
        </div>
        
        <p>If you're having trouble clicking the button, copy and paste the URL above into your web browser.</p>
        
        <p>Best regards,<br>The AdSaga Team</p>
      </div>
      
      <div class="footer">
        <p>This email was sent to ${email}</p>
        <p>If you have any questions, please contact our support team.</p>
      </div>
    </body>
    </html>
  `;
};
