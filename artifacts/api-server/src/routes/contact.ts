import { Router } from "express";
import nodemailer from "nodemailer";

const router = Router();

const FIELD_LIMITS: Record<string, number> = {
  name: 200,
  email: 254,
  phone: 50,
  interest: 200,
  message: 5_000,
  subject: 200,
};
const MAX_EXTRA_FIELD_LENGTH = 500;
const MAX_FIELD_COUNT = 40;
const EMAIL_PATTERN = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      case "'": return "&#39;";
      default: return character;
    }
  });
}

function validateSubmission(body: unknown): Record<string, string> | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;

  const entries = Object.entries(body);
  if (entries.length > MAX_FIELD_COUNT) return null;

  const values: Record<string, string> = {};
  for (const [key, value] of entries) {
    if (!key || key.length > 80 || typeof value !== "string") return null;

    const maxLength = FIELD_LIMITS[key] ?? MAX_EXTRA_FIELD_LENGTH;
    if (value.length > maxLength) return null;
    values[key] = value.trim();
  }

  if (!values.name || !values.email || !EMAIL_PATTERN.test(values.email)) return null;
  if (values.subject && /[\r\n]/.test(values.subject)) return null;

  return values;
}

router.post("/contact", async (req, res) => {
  const submission = validateSubmission(req.body);
  if (!submission) {
    res.status(400).json({ success: false, error: "Please provide a valid name and email with fields within the accepted length limits" });
    return;
  }

  const { name, email, phone, interest, message, subject, ...rest } = submission;

  if (submission.container) {
    const deliveryCity = submission.delivery_city;
    const deliveryZip = submission.delivery_zip;
    if (!deliveryCity || !deliveryZip) {
      res.status(400).json({
        success: false,
        error: "Delivery city and ZIP or postal code are required for quote requests.",
      });
      return;
    }
  }

  const smtpUser    = process.env.SMTP_USER;
  const smtpPass    = process.env.SMTP_PASS;
  const contactEmail = process.env.CONTACT_EMAIL ?? smtpUser;

  if (!smtpUser || !smtpPass) {
    req.log.warn("SMTP_USER or SMTP_PASS not configured");
    res.status(503).json({ success: false, error: "Email service not configured" });
    return;
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.zoho.com",
    port: 465,
    secure: true,
    auth: { user: smtpUser, pass: smtpPass },
  });

  const extraRows = Object.entries(rest)
    .filter(([, v]) => v && v !== "undefined")
    .map(([k, v]) => `<tr><td style="padding:4px 8px;color:#888;text-transform:capitalize;">${escapeHtml(k.replace(/_/g, " "))}</td><td style="padding:4px 8px;font-weight:600;">${escapeHtml(v)}</td></tr>`)
    .join("");

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;">
      <div style="background:#e84b2c;padding:16px 20px;">
        <h2 style="margin:0;color:#fff;font-size:18px;letter-spacing:2px;text-transform:uppercase;">
          ${escapeHtml(subject || "Built Box Containers — New Inquiry")}
        </h2>
      </div>
      <div style="padding:20px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:4px 8px;color:#888;">Name</td><td style="padding:4px 8px;font-weight:600;">${escapeHtml(name)}</td></tr>
          <tr><td style="padding:4px 8px;color:#888;">Email</td><td style="padding:4px 8px;font-weight:600;">${escapeHtml(email)}</td></tr>
          <tr><td style="padding:4px 8px;color:#888;">Phone</td><td style="padding:4px 8px;">${escapeHtml(phone || "—")}</td></tr>
          ${interest ? `<tr><td style="padding:4px 8px;color:#888;">Interest</td><td style="padding:4px 8px;">${escapeHtml(interest)}</td></tr>` : ""}
          ${message ? `<tr><td style="padding:4px 8px;color:#888;vertical-align:top;">Message</td><td style="padding:4px 8px;">${escapeHtml(message).replace(/\n/g, "<br>")}</td></tr>` : ""}
          ${extraRows}
        </table>
      </div>
    </div>`;

  try {
    await transporter.sendMail({
      from: `"Built Box Containers" <${smtpUser}>`,
      to: contactEmail,
      replyTo: email,
      subject: subject ?? `New Inquiry from ${name ?? email}`,
      html,
    });
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to send contact email");
    res.status(500).json({ success: false, error: "Failed to send email" });
  }
});

export default router;
