const otpVerificationEmail = (otpCode, isResend = false) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin: 0; font-size: 28px;">AdSaga</h1>
          <p style="color: #666; margin: 5px 0 0 0;">Email Verification</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <h2 style="color: #333; margin-bottom: 20px;">
            ${isResend ? 'New Verification Code' : 'Verify Your Email'}
          </h2>
          <p style="color: #666; font-size: 16px; margin-bottom: 30px;">
            ${isResend 
              ? 'Here is your new verification code:' 
              : 'To complete your registration, please use the verification code below:'
            }
          </p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 36px; letter-spacing: 8px; text-align: center; margin: 0; font-weight: bold;">
              ${otpCode}
            </h1>
          </div>
          
          <p style="color: #e74c3c; font-size: 14px; margin: 20px 0;">
            ⏰ This code will expire in 10 minutes
          </p>
        </div>
        
        <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
          <p style="color: #666; font-size: 14px; margin: 0; text-align: center;">
            If you didn't request this verification, please ignore this email.
          </p>
          <p style="color: #666; font-size: 14px; margin: 10px 0 0 0; text-align: center;">
            This is an automated message, please do not reply.
          </p>
        </div>
      </div>
    </div>
  `;
};

module.exports = otpVerificationEmail;
