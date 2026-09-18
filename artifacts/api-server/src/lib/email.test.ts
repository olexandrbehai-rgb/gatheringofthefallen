import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mailer = vi.hoisted(() => ({
  createTransport: vi.fn(),
  sendMail: vi.fn(),
}));

vi.mock("nodemailer", () => ({
  default: {
    createTransport: mailer.createTransport,
  },
}));

import { sendTrustedDeviceReplacementEmail } from "./email";
import { sendTrustedDeviceCleanupAlertEmail } from "./email";

describe("trusted device replacement email", () => {
  beforeEach(() => {
    process.env.SMTP_EMAIL = "security@example.com";
    process.env.SMTP_PASSWORD = "test-password";
    mailer.sendMail.mockReset();
    mailer.sendMail.mockResolvedValue(undefined);
    mailer.createTransport.mockReturnValue({ sendMail: mailer.sendMail });
  });

  afterEach(() => {
    delete process.env.SMTP_EMAIL;
    delete process.env.SMTP_PASSWORD;
  });

  it("keeps the normal one-off replacement alert unchanged", async () => {
    await sendTrustedDeviceReplacementEmail({
      ownerEmail: "owner@example.com",
      replacedAt: new Date("2026-09-17T12:30:00.000Z"),
      replacementCount: 1,
    });

    expect(mailer.sendMail).toHaveBeenCalledWith(expect.objectContaining({
      subject: "Security alert: trusted device replaced",
      text: expect.not.stringContaining("WARNING:"),
      html: expect.not.stringContaining("WARNING:"),
    }));
  });

  it("adds an urgent warning when replacements form a burst", async () => {
    await sendTrustedDeviceReplacementEmail({
      ownerEmail: "owner@example.com",
      replacedAt: new Date("2026-09-17T12:30:00.000Z"),
      replacementCount: 3,
    });

    expect(mailer.sendMail).toHaveBeenCalledWith(expect.objectContaining({
      subject: "URGENT security alert: repeated trusted device replacements",
      text: expect.stringContaining(
        "WARNING: 3 trusted device replacements were recorded in the last 24 hours.",
      ),
      html: expect.stringContaining(
        "WARNING: 3 trusted device replacements were recorded in the last 24 hours.",
      ),
    }));
  });
});

describe("trusted device cleanup alert email", () => {
  beforeEach(() => {
    process.env.SMTP_EMAIL = "security@example.com";
    process.env.SMTP_PASSWORD = "test-password";
    mailer.sendMail.mockReset();
    mailer.sendMail.mockResolvedValue(undefined);
    mailer.createTransport.mockReturnValue({ sendMail: mailer.sendMail });
  });

  afterEach(() => {
    delete process.env.SMTP_EMAIL;
    delete process.env.SMTP_PASSWORD;
  });

  it("alerts the configured monitoring mailbox without owner data", async () => {
    await sendTrustedDeviceCleanupAlertEmail();

    expect(mailer.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "security@example.com",
        subject: "ALERT: trusted-device security event cleanup degraded",
        text: expect.stringContaining(
          "Trusted-device security event cleanup is failing repeatedly",
        ),
        html: expect.stringContaining(
          "database connectivity and the owner-device security events table health",
        ),
      }),
    );
    expect(mailer.sendMail.mock.calls[0][0].text).not.toContain(
      "owner@example.com",
    );
    expect(mailer.sendMail.mock.calls[0][0].html).not.toContain(
      "owner@example.com",
    );
  });
});