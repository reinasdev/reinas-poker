import nodemailer from "nodemailer";
import { env } from "@/infrastructure/config/env";

const transport = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: false,
});

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function magicCodeHtml(code: string) {
  const safeCode = escapeHtml(code);
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Seu código do Planning Poker</title>
  </head>
  <body style="margin:0;background:#000000;color:#f5f5f5;font-family:'JetBrains Mono','SFMono-Regular',Consolas,monospace;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#000000;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border:1px solid #333333;background:#0a0a0a;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:28px 28px 16px;">
                <p style="margin:0 0 12px;color:#ffffff;font-size:12px;font-weight:700;letter-spacing:0;text-transform:uppercase;">auth.magic_code</p>
                <h1 style="margin:0;color:#ffffff;font-size:24px;line-height:1.25;font-weight:800;">Planning Poker</h1>
                <p style="margin:12px 0 0;color:#d4d4d4;font-size:14px;line-height:1.7;">Use o código abaixo para continuar seu acesso. Ele expira em 10 minutos.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 28px;">
                <div style="border:1px solid #3f3f3f;background:#050505;border-radius:8px;padding:20px;text-align:center;">
                  <p style="margin:0 0 10px;color:#8a8a8a;font-size:11px;font-weight:700;text-transform:uppercase;">codigo</p>
                  <p style="margin:0;color:#ffffff;font-size:36px;line-height:1;font-weight:800;letter-spacing:8px;">${safeCode}</p>
                </div>
                <p style="margin:18px 0 0;color:#8a8a8a;font-size:12px;line-height:1.6;">Se você não solicitou este acesso, ignore este e-mail.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendMagicCode(email: string, code: string) {
  await transport.sendMail({
    from: env.SMTP_FROM,
    to: email,
    subject: "Seu código do Planning Poker",
    text: `Seu código é ${code}. Ele expira em 10 minutos.`,
    html: magicCodeHtml(code),
  });
}
