import { Resend } from 'resend';

import { RESEND_API_KEY, EMAIL_FROM, EMAIL_STUB } from '../config/env.js';
import { otpEmail } from '../emails/otp.email.js';
import { welcomeEmail } from '../emails/welcome.email.js';
import { orderStatusEmail } from '../emails/order-status.email.js';
import { failedDeliveryEmail } from '../emails/failed-delivery.email.js';
import { rescheduledEmail } from '../emails/rescheduled.email.js';

let resendClient = null;
if (!EMAIL_STUB && RESEND_API_KEY) {
  resendClient = new Resend(RESEND_API_KEY);
}

// Single low-level transport. Per the spec, callers do NOT await this for
// correctness — post-commit notification must not roll back business state.
// Errors are logged; never thrown. Idempotency key is passed to Resend so a
// retry of the same logical event doesn't double-send.
export async function sendEmail({ to, subject, html, idempotencyKey }) {
  if (EMAIL_STUB || !resendClient) {
    console.log(
      `[email-stub] idempotencyKey=${idempotencyKey || '-'} to=${to} subject="${subject}"`
    );
    return { ok: true, stubbed: true };
  }

  const started = Date.now();
  try {
    const opts = idempotencyKey ? { idempotencyKey } : {};
    const { data, error } = await resendClient.emails.send(
      {
        from: EMAIL_FROM,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      },
      opts
    );
    if (error) {
      console.error(
        `[email] Resend returned error (idempotencyKey=${idempotencyKey}, ms=${Date.now() - started}):`,
        error
      );
      return { ok: false, error };
    }
    console.log(
      `[email] sent idempotencyKey=${idempotencyKey} to=${to} subject="${subject}" id=${data?.id} ms=${Date.now() - started}`
    );
    return { ok: true, id: data?.id };
  } catch (err) {
    console.error(
      `[email] Resend threw (idempotencyKey=${idempotencyKey}, ms=${Date.now() - started}):`,
      err
    );
    return { ok: false, error: err };
  }
}

// --- Semantic helpers — controllers / services call these, never the raw sender.

export function sendOtpEmail({ email, code, purpose, expiresAt }) {
  const tpl = otpEmail({ email, code, purpose, expiresAt });
  return sendEmail({
    to: email,
    subject: tpl.subject,
    html: tpl.html,
    idempotencyKey: `otp:${email}:${purpose}:${code}`,
  });
}

export function sendWelcomeEmail({ user }) {
  const tpl = welcomeEmail({ fullName: user.fullName, email: user.email });
  return sendEmail({
    to: user.email,
    subject: tpl.subject,
    html: tpl.html,
    idempotencyKey: `welcome:${user._id}`,
  });
}

export function sendOrderStatusEmail({ timeline }) {
  const tpl = orderStatusEmail({ timeline });
  return sendEmail({
    to: timeline.customerEmail,
    subject: tpl.subject,
    html: tpl.html,
    idempotencyKey: `order-status:${timeline._id}`,
  });
}

export function sendFailedDeliveryEmail({ timeline, frontendReschedulePath }) {
  const tpl = failedDeliveryEmail({ timeline, frontendReschedulePath });
  return sendEmail({
    to: timeline.customerEmail,
    subject: tpl.subject,
    html: tpl.html,
    idempotencyKey: `failed-delivery:${timeline._id}`,
  });
}

export function sendRescheduledEmail({ timeline }) {
  const tpl = rescheduledEmail({ timeline });
  return sendEmail({
    to: timeline.customerEmail,
    subject: tpl.subject,
    html: tpl.html,
    idempotencyKey: `rescheduled:${timeline._id}`,
  });
}
