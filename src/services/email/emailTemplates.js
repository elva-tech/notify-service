function getOtpTemplate({ otp, appId, fallbackMessage }) {
  const tenant = typeof appId === 'string' && appId.trim() ? appId.trim() : 'ELVA';
  const code = typeof otp === 'string' && otp.trim() ? otp.trim() : null;
  const message = typeof fallbackMessage === 'string' && fallbackMessage.trim()
    ? fallbackMessage.trim()
    : 'Your one-time password is ready.';

  return `
    <div style="font-family: Arial, sans-serif; background: #f7f8fb; padding: 24px;">
      <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 24px;">
        <h2 style="margin-top: 0; color: #1d2939;">${tenant} OTP Verification</h2>
        <p style="color: #344054; font-size: 14px; line-height: 1.5;">
          ${message}
        </p>
        <div style="margin: 20px 0; text-align: center;">
          <span style="display: inline-block; font-size: 28px; letter-spacing: 6px; font-weight: 700; color: #101828;">
            ${code || '******'}
          </span>
        </div>
        <p style="color: #475467; font-size: 13px; margin-bottom: 0;">
          This OTP expires in 5 minutes. Do not share this code with anyone.
        </p>
      </div>
    </div>
  `;
}

module.exports = {
  getOtpTemplate,
};
