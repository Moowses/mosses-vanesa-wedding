import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { Resend } from "resend";

function isAuthed(req: Request) {
  const code = req.headers.get("x-admin-code");
  return code === "1433";
}

const esc = (s: string) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

function buildAnnouncementHtml(opts: { subject: string; body: string }) {
  const safeBody = esc(opts.body).replace(/\n/g, "<br/>");

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
        <td style="padding:22px 28px;">
          <h2 style="margin:0 0 12px;font-size:18px;">${esc(opts.subject)}</h2>
          <div style="font-size:15px;line-height:1.7;">
            ${safeBody}
          </div>

          <hr style="border:none;border-top:1px solid #eee;margin:22px 0;" />

          <p style="margin:0;font-size:13px;color:#666;">
            For more wedding details, visit:
            <a href="https://mossesandvanesa.com" style="color:#c07a5a;text-decoration:none;font-weight:bold;">
              mossesandvanesa.com
            </a>
          </p>
        </td>
      </tr>
    </table>
  </div>
  `.trim();
}

export async function POST(req: Request) {
  if (!isAuthed(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const payload = await req.json().catch(() => ({}));
  const subject = String(payload.subject || "").trim();
  const body = String(payload.body || "").trim();
  const optInOnly = !!payload.optInOnly;

  if (!subject || !body) {
    return NextResponse.json(
      { ok: false, error: "Subject and body are required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    return NextResponse.json(
      { ok: false, error: "Missing RESEND_API_KEY or EMAIL_FROM env vars" },
      { status: 500 }
    );
  }

  const resend = new Resend(apiKey);

  const snap = await db.collection("rsvps").get();

  const emails = snap.docs
    .map((d) => d.data() as any)
    .filter((x) => !!x?.email)
    .filter((x) => (optInOnly ? !!x?.announcementOptIn : true))
    .map((x) => String(x.email).trim().toLowerCase())
    .filter((e) => e.includes("@"));

  const uniqueEmails = Array.from(new Set(emails));

  const html = buildAnnouncementHtml({ subject, body });

  let sent = 0;
  const failed: string[] = [];

  // Safe send loop (you can optimize batching later)
  for (const to of uniqueEmails) {
    try {
      await resend.emails.send({
        from,
        to,
        subject,
        html,
      });
      sent++;
    } catch {
      failed.push(to);
    }
  }

  return NextResponse.json({ ok: true, sent, failedCount: failed.length });
}
