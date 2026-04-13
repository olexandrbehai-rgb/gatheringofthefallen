import { Router, type Request, type Response } from "express";
import { Pool } from "pg";
import nodemailer from "nodemailer";
import { logger } from "../lib/logger";

const router = Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

function buildEmailHtml(order: {
  product: string;
  size: string;
  quantity: number;
  total: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    country: string;
    city: string;
    street: string;
    postalCode: string;
    comment?: string;
  };
  paypalOrderId: string;
  paypalStatus: string;
}) {
  const c = order.customer;
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1a1a2e;color:#e0e0e0;padding:20px;border:2px solid #8a2be2;border-radius:8px;">
      <h1 style="color:#00ffff;text-align:center;border-bottom:1px solid #8a2be2;padding-bottom:10px;">
        🔥 Нове замовлення — Gathering Of The Fallen
      </h1>
      <h2 style="color:#8a2be2;">Товар</h2>
      <table style="width:100%;color:#e0e0e0;">
        <tr><td style="padding:4px 8px;color:#999;">Назва:</td><td style="padding:4px 8px;font-weight:bold;">${order.product}</td></tr>
        <tr><td style="padding:4px 8px;color:#999;">Розмір:</td><td style="padding:4px 8px;">${order.size}</td></tr>
        <tr><td style="padding:4px 8px;color:#999;">Кількість:</td><td style="padding:4px 8px;">${order.quantity}</td></tr>
        <tr><td style="padding:4px 8px;color:#999;">Сума:</td><td style="padding:4px 8px;font-weight:bold;color:#00ffff;">${order.total}</td></tr>
      </table>
      <h2 style="color:#8a2be2;">Покупець</h2>
      <table style="width:100%;color:#e0e0e0;">
        <tr><td style="padding:4px 8px;color:#999;">Ім'я:</td><td style="padding:4px 8px;">${c.firstName} ${c.lastName}</td></tr>
        <tr><td style="padding:4px 8px;color:#999;">Email:</td><td style="padding:4px 8px;">${c.email}</td></tr>
        <tr><td style="padding:4px 8px;color:#999;">Телефон:</td><td style="padding:4px 8px;">${c.phone}</td></tr>
        <tr><td style="padding:4px 8px;color:#999;">Адреса:</td><td style="padding:4px 8px;">${c.street}, ${c.city}, ${c.country}, ${c.postalCode}</td></tr>
        ${c.comment ? `<tr><td style="padding:4px 8px;color:#999;">Коментар:</td><td style="padding:4px 8px;">${c.comment}</td></tr>` : ""}
      </table>
      <h2 style="color:#8a2be2;">PayPal</h2>
      <table style="width:100%;color:#e0e0e0;">
        <tr><td style="padding:4px 8px;color:#999;">Order ID:</td><td style="padding:4px 8px;font-family:monospace;">${order.paypalOrderId}</td></tr>
        <tr><td style="padding:4px 8px;color:#999;">Статус:</td><td style="padding:4px 8px;color:#00ff00;">${order.paypalStatus}</td></tr>
      </table>
      <p style="text-align:center;color:#666;font-size:12px;margin-top:20px;">Gathering Of The Fallen — Merch Order System</p>
    </div>
  `;
}

async function sendOrderEmail(order: Parameters<typeof buildEmailHtml>[0]) {
  const emailUser = process.env.SMTP_EMAIL;
  const emailPass = process.env.SMTP_PASSWORD;

  if (!emailUser || !emailPass) {
    logger.warn("SMTP_EMAIL or SMTP_PASSWORD not set — skipping email notification");
    return false;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  await transporter.sendMail({
    from: `"GtF Merch" <${emailUser}>`,
    to: emailUser,
    subject: `🔥 Нове замовлення: ${order.product} — ${order.total}`,
    html: buildEmailHtml(order),
  });

  return true;
}

router.post("/order-notification", async (req: Request, res: Response) => {
  try {
    const { product, size, quantity, total, customer, paypalOrderId, paypalStatus } = req.body;

    const dbResult = await pool.query(
      `INSERT INTO orders (product, size, quantity, total, first_name, last_name, email, phone, country, city, street, postal_code, comment, paypal_order_id, paypal_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING id`,
      [
        product, size, quantity, total,
        customer?.firstName, customer?.lastName, customer?.email, customer?.phone,
        customer?.country, customer?.city, customer?.street, customer?.postalCode,
        customer?.comment || null,
        paypalOrderId, paypalStatus,
      ]
    );

    const orderId = dbResult.rows[0]?.id;

    logger.info({
      msg: "Order saved to database",
      orderId,
      product,
      total,
      paypalOrderId,
      paypalStatus,
    });

    let emailSent = false;
    try {
      emailSent = await sendOrderEmail({
        product, size, quantity, total, customer, paypalOrderId, paypalStatus,
      });
    } catch (emailErr) {
      logger.error({ msg: "Failed to send order email", error: emailErr });
    }

    res.json({
      success: true,
      message: "Order saved",
      orderId,
      emailSent,
    });
  } catch (error) {
    logger.error({ msg: "Order notification error", error });
    res.status(500).json({ success: false, message: "Internal error" });
  }
});

export default router;
