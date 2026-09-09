import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  if (!resend) {
    // No Resend API key configured yet — fall back to logging the link so
    // the flow is still testable locally. Add RESEND_API_KEY to send real email.
    console.log(`[mock email] Password reset for ${to}: ${resetUrl}`);
    return;
  }

  await resend.emails.send({
    from: "TomorrowPlan <onboarding@resend.dev>",
    to,
    subject: "Reset your TomorrowPlan password",
    html: `
      <p>Someone requested a password reset for your TomorrowPlan account.</p>
      <p><a href="${resetUrl}">Click here to choose a new password</a> (expires in 1 hour).</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  });
}
