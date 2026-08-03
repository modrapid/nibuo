import { resend, FROM_EMAIL } from "./resendClient";

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailInput) {
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });
    return { success: true, id: result.data?.id };
  } catch (err) {
    console.error("Email send failed:", err);
    return { success: false, error: "Failed to send email." };
  }
}
