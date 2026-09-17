import nodemailer from "nodemailer";

export interface TrustedDeviceReplacementNotification {
  ownerEmail: string;
  replacedAt: Date;
}

export async function sendTrustedDeviceReplacementEmail({
  ownerEmail,
  replacedAt,
}: TrustedDeviceReplacementNotification): Promise<void> {
  const smtpEmail = process.env.SMTP_EMAIL;
  const smtpPassword = process.env.SMTP_PASSWORD;
  if (!smtpEmail || !smtpPassword) {
    throw new Error("SMTP_EMAIL and SMTP_PASSWORD must be configured");
  }

  const replacementTime = replacedAt.toISOString();
  const guidance =
    "If you did not replace this trusted device, sign out other sessions, change the password for your sign-in account, and contact support immediately.";
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
    subject: "Security alert: trusted device replaced",
    text: [
      "The trusted device for your Gathering Of The Fallen owner account was replaced.",
      `Replacement time: ${replacementTime}`,
      "",
      guidance,
    ].join("\n"),
    html: `
      <h2>Trusted device replaced</h2>
      <p>The trusted device for your Gathering Of The Fallen owner account was replaced.</p>
      <p><strong>Replacement time:</strong> ${replacementTime}</p>
      <p><strong>If this was not you:</strong> ${guidance}</p>
    `,
  });
}