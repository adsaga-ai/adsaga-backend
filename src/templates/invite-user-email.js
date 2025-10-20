module.exports = function inviteUserEmailTemplate({ organisationName, inviteUrl, invitedEmail }) {
  return `
  <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #111827; background:#ffffff; padding:24px">
    <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
      <img src="https://raw.githubusercontent.com/adsaga/assets/main/adsaga_logo.png" alt="AdSaga" width="28" height="28" style="display:block; border-radius:6px;" />
      <span style="font-weight:700; color:#111827; font-size:16px;">AdSaga</span>
    </div>
    <h2 style="margin:0 0 12px; font-size:20px; color:#111827;">You're invited to join ${organisationName} on AdSaga</h2>
    <p style="margin:0 0 8px;">Hello${invitedEmail ? ' ' + invitedEmail : ''},</p>
    <p style="margin:0 0 8px;">You've been invited to join <strong>${organisationName}</strong> on AdSaga.</p>
    <p style="margin:0 0 16px;">Click the button below to open the invite page where you'll confirm your name and set your password to join the organisation.</p>
    <p style="margin:0 0 16px;">
      <a href="${inviteUrl}" style="display:inline-block; padding:12px 18px; background:#7c3aed; color:#fff; text-decoration:none; border-radius:10px; font-weight:600;">Accept Invitation</a>
    </p>
    <p style="margin:0 0 8px; font-size:13px; color:#6b7280;">If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="margin:0 0 16px; word-break:break-all;"><a href="${inviteUrl}" style="color:#6d28d9; text-decoration:underline;">${inviteUrl}</a></p>
    <p style="margin:0; font-size:13px; color:#6b7280;">This link will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.</p>
    <p style="margin:16px 0 0; color:#6b7280;">— The AdSaga Team</p>
  </div>
  `;
};
