import { describe, expect, it, vi } from "vitest";

describe("mailer transport", () => {
  it("configures unauthenticated smtp by default", async () => {
    vi.resetModules();
    vi.stubEnv("SMTP_HOST", "mailpit");
    vi.stubEnv("SMTP_PORT", "1025");
    vi.stubEnv("SMTP_SECURE", "false");
    vi.stubEnv("SMTP_USER", "");
    vi.stubEnv("SMTP_PASSWORD", "");
    const createTransport = vi.fn(() => ({ sendMail: vi.fn() }));
    vi.doMock("nodemailer", () => ({
      default: { createTransport },
    }));

    await import("../mailer");

    expect(createTransport).toHaveBeenCalledWith({
      host: "mailpit",
      port: 1025,
      secure: false,
      auth: undefined,
    });
    vi.unstubAllEnvs();
    vi.doUnmock("nodemailer");
  });

  it("configures authenticated secure smtp when credentials are present", async () => {
    vi.resetModules();
    vi.stubEnv("SMTP_HOST", "smtp.example.com");
    vi.stubEnv("SMTP_PORT", "465");
    vi.stubEnv("SMTP_SECURE", "true");
    vi.stubEnv("SMTP_USER", "user@example.com");
    vi.stubEnv("SMTP_PASSWORD", "app-password");
    const createTransport = vi.fn(() => ({ sendMail: vi.fn() }));
    vi.doMock("nodemailer", () => ({
      default: { createTransport },
    }));

    await import("../mailer");

    expect(createTransport).toHaveBeenCalledWith({
      host: "smtp.example.com",
      port: 465,
      secure: true,
      auth: { user: "user@example.com", pass: "app-password" },
    });
    vi.unstubAllEnvs();
    vi.doUnmock("nodemailer");
  });
});
