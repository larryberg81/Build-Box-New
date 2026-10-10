import { Router } from "express";
import nodemailer from "nodemailer";

const router = Router();

router.post("/contact", async (req, res) => {
  const body = req.body as Record<string, unknown>;
  const { name, email, phone, interest, message, subject, ...rest } = body as Record<string, string>;

  if (typeof body.container === "string" && body.container.trim()) {
    const deliveryCity = typeof body.delivery_city === "string" ? body.delivery_city.trim() : "";
    const deliveryZip = typeof body.delivery_zip === "string" ? body.delivery_zip.trim() : "";
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
    .map(([k, v]) => `<tr><td style="padding:4px 8px;color:#888;text-transform:capitalize;">${k.replace(/_/g, " ")}</td><td style="padding:4px 8px;font-weight:600;">${v}</td></tr>`)
    .join("");

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;">
      <div style="background:#e84b2c;padding:16px 20px;">
        <h2 style="margin:0;color:#fff;font-size:18px;letter-spacing:2px;text-transform:uppercase;">
          ${subject ?? "Built Box Containers — New Inquiry"}
        </h2>
      </div>
      <div style="padding:20px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:4px 8px;color:#888;">Name</td><td style="padding:4px 8px;font-weight:600;">${name ?? "—"}</td></tr>
          <tr><td style="padding:4px 8px;color:#888;">Email</td><td style="padding:4px 8px;font-weight:600;">${email ?? "—"}</td></tr>
          <tr><td style="padding:4px 8px;color:#888;">Phone</td><td style="padding:4px 8px;">${phone ?? "—"}</td></tr>
          ${interest ? `<tr><td style="padding:4px 8px;color:#888;">Interest</td><td style="padding:4px 8px;">${interest}</td></tr>` : ""}
          ${message ? `<tr><td style="padding:4px 8px;color:#888;vertical-align:top;">Message</td><td style="padding:4px 8px;">${message.replace(/\n/g, "<br>")}</td></tr>` : ""}
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
