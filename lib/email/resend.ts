import { Resend } from "resend";

const esc = (s: string) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export function buildRsvpConfirmationHtml(opts: {
  guestName: string;
  updateUrl: string;
}) {
  return `
  <div style="background:#f6f6f6;padding:24px 0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:#222;">
      <tr>
        <td style="padding:0;">
          <img
            src="https://mossesandvanesa.com/headeremail.png"
            alt="Mosses & Vanesa"
            width="600"
            style="display:block;width:100%;height:auto;"
          />
        </td>
      </tr>

      <tr>
        <td style="padding:28px 32px;">
          <p style="margin:0 0 16px;font-size:16px;">
            Dear <strong>${esc(opts.guestName)}</strong>,
          </p>

          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">
            We are truly excited to have you be part of something very special to us. Thank you for confirming your attendance. It means so much to know that you will be there to witness and celebrate our wedding day.
          </p>

          <p style="margin:0 0 20px;font-size:15px;line-height:1.7;">
            Your presence will make our celebration even more meaningful as we begin this new chapter of our lives together. We cannot wait to share this unforgettable moment with you.
          </p>

          <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />

          <h3 style="margin:0 0 12px;font-size:17px;">Wedding Details</h3>

          <p style="margin:0 0 6px;font-size:15px;"><strong>March 6, 2026</strong></p>
          <p style="margin:0 0 6px;font-size:15px;"><strong>2:00 PM</strong></p>
          <p style="margin:0 0 18px;font-size:15px;">
            Saint Michael the Archangel Quasi Parish, Eden
          </p>

          <p style="margin:0 0 10px;font-size:15px;line-height:1.7;">
            For more information regarding attire, program details, and other important updates, please visit our wedding website:
          </p>

          <p style="margin:0 0 18px;">
            <a href="https://mossesandvanesa.com" style="color:#c07a5a;text-decoration:none;font-weight:bold;">
              https://mossesandvanesa.com
            </a>
          </p>

          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">
            If you would like to support us as we start our family together, you may do so by scanning the QR code provided. Your love and presence are more than enough, and any support is sincerely appreciated.
          </p>

          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">
            We look forward to celebrating with you.
          </p>

          <p style="margin:0;font-size:15px;line-height:1.7;">
            With love and gratitude,<br/>
            <strong>Mosses and Vanesa</strong>
          </p>
        </td>
      </tr>

      <tr>
        <td style="padding:16px 32px 28px;text-align:center;font-size:12px;color:#777;">
          Need to update your RSVP?<br/>
          <a href="${esc(opts.updateUrl)}" style="color:#777;text-decoration:underline;">
            Manage your RSVP
          </a>
        </td>
      </tr>
    </table>
  </div>
  `.trim();
}

export async function sendRsvpConfirmationEmail(opts: {
  to: string;
  guestName: string;
  updateUrl: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    return { sent: false as const, id: null as string | null };
  }

  const resend = new Resend(apiKey);

  const html = buildRsvpConfirmationHtml({
    guestName: opts.guestName,
    updateUrl: opts.updateUrl,
  });

  const result = await resend.emails.send({
    from,
    to: opts.to,
    subject: "We’re So Excited to Celebrate With You",
    html,
  });

  const id = (result as any)?.data?.id ?? (result as any)?.id ?? null;

  return { sent: true as const, id };
}
