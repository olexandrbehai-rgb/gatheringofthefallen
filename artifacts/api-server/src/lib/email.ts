import nodemailer from "nodemailer";
import {
  OWNER_DEVICE_REPLACEMENT_BURST_THRESHOLD,
  OWNER_DEVICE_REPLACEMENT_BURST_WINDOW_HOURS,
} from "./ownerDeviceSecurity";

export interface TrustedDeviceReplacementNotification {
  ownerEmail: string;
  replacedAt: Date;
  replacementCount: number;
}

const TRUSTED_DEVICE_CLEANUP_ALERT_SUBJECT =
  "ALERT: trusted-device security event cleanup degraded";
const TRUSTED_DEVICE_CLEANUP_ALERT_MESSAGE =
  "Trusted-device security event cleanup is failing repeatedly. Check database connectivity and the owner-device security events table health.";

export async function sendTrustedDeviceCleanupAlertEmail(): Promise<void> {
  const smtpEmail = process.env.SMTP_EMAIL;
  const smtpPassword = process.env.SMTP_PASSWORD;
  if (!smtpEmail || !smtpPassword) {
    throw new Error("SMTP_EMAIL and SMTP_PASSWORD must be configured");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: smtpEmail,
      pass: smtpPassword,
    },
  });

  await transporter.sendMail({
    from: `"Gathering Of The Fallen Security" <${smtpEmail}>`,
    to: smtpEmail,
    subject: TRUSTED_DEVICE_CLEANUP_ALERT_SUBJECT,
    text: TRUSTED_DEVICE_CLEANUP_ALERT_MESSAGE,
    html: `<h2>${TRUSTED_DEVICE_CLEANUP_ALERT_SUBJECT}</h2><p>${TRUSTED_DEVICE_CLEANUP_ALERT_MESSAGE}</p>`,
  });
}

export async function sendTrustedDeviceReplacementEmail({
  ownerEmail,
  replacedAt,
  replacementCount,
}: TrustedDeviceReplacementNotification): Promise<void> {
  const smtpEmail = process.env.SMTP_EMAIL;
  const smtpPassword = process.env.SMTP_PASSWORD;
  if (!smtpEmail || !smtpPassword) {
    throw new Error("SMTP_EMAIL and SMTP_PASSWORD must be configured");
  }

  const replacementTime = replacedAt.toISOString();
  const guidance =
    "If you did not replace this trusted device, sign out other sessions, change the password for your sign-in account, and contact support immediately.";
  const replacementBurst =
    replacementCount >= OWNER_DEVICE_REPLACEMENT_BURST_THRESHOLD;
  const burstWarning = replacementBurst
    ? `WARNING: ${replacementCount} trusted device replacements were recorded in the last ${OWNER_DEVICE_REPLACEMENT_BURST_WINDOW_HOURS} hours. Treat this repeated activity as suspicious and secure the owner account immediately.`
    : null;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: smtpEmail,
      pass: smtpPassword,
    },
  });

  await transporter.sendMail({
    from: `"Gathering Of The Fallen Security" <${smtpEmail}>`,
    to: ownerEmail,
    subject: replacementBurst
      ? "URGENT security alert: repeated trusted device replacements"
      : "Security alert: trusted device replaced",
    text: [
      "The trusted device for your Gathering Of The Fallen owner account was replaced.",
      `Replacement time: ${replacementTime}`,
      ...(burstWarning ? ["", burstWarning] : []),
      "",
      guidance,
    ].join("\n"),
    html: `
      <h2>Trusted device replaced</h2>
      <p>The trusted device for your Gathering Of The Fallen owner account was replaced.</p>
      <p><strong>Replacement time:</strong> ${replacementTime}</p>
      ${burstWarning ? `<p><strong>${burstWarning}</strong></p>` : ""}
      <p><strong>If this was not you:</strong> ${guidance}</p>
    `,
  });
}