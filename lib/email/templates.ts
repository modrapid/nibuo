export function verificationEmailTemplate(verifyUrl: string) {
  return `
  <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
    <h1 style="color: #0F172A; font-size: 22px;">Verify your email</h1>
    <p style="color: #475569; font-size: 14px; line-height: 1.6;">
      Thanks for signing up on xbare.top. Click the button below to verify your email address.
    </p>
    <a href="${verifyUrl}" style="display: inline-block; background: #0F172A; color: #fff;
       padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; margin-top: 16px;">
      Verify Email
    </a>
    <p style="color: #94A3B8; font-size: 12px; margin-top: 24px;">
      If you didn't create this account, you can safely ignore this email.
    </p>
  </div>`;
}

export function passwordResetTemplate(resetUrl: string) {
  return `
  <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
    <h1 style="color: #0F172A; font-size: 22px;">Reset your password</h1>
    <p style="color: #475569; font-size: 14px; line-height: 1.6;">
      We received a request to reset your password. Click below to choose a new one.
    </p>
    <a href="${resetUrl}" style="display: inline-block; background: #0F172A; color: #fff;
       padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; margin-top: 16px;">
      Reset Password
    </a>
    <p style="color: #94A3B8; font-size: 12px; margin-top: 24px;">
      If you didn't request this, you can safely ignore this email. This link expires in 1 hour.
    </p>
  </div>`;
}

export function fileDownloadedNotificationTemplate(fileName: string, downloadCount: number) {
  return `
  <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
    <h1 style="color: #0F172A; font-size: 20px;">Your file was downloaded</h1>
    <p style="color: #475569; font-size: 14px; line-height: 1.6;">
      <strong>${fileName}</strong> has now been downloaded ${downloadCount} time(s).
    </p>
  </div>`;
}

export function abuseReportAdminAlertTemplate(shortCode: string, reason: string) {
  return `
  <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
    <h1 style="color: #0F172A; font-size: 20px;">New abuse report</h1>
    <p style="color: #475569; font-size: 14px;">File: <strong>/${shortCode}</strong></p>
    <p style="color: #475569; font-size: 14px;">Reason: ${reason}</p>
    <p style="color: #94A3B8; font-size: 12px; margin-top: 16px;">
      Review it in the admin panel under Reports.
    </p>
  </div>`;
}
