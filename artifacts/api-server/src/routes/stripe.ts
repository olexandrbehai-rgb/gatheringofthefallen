import { Router, type Request, type Response } from "express";
import Stripe from "stripe";
import { Pool } from "pg";
import nodemailer from "nodemailer";
import { logger } from "../lib/logger";

const router = Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
}

const NOTIFICATION_EMAIL = "gatheringofthefallen@gmail.com";

async function sendOrderEmail(order: {
  customerName: string;
  email: string;
  phone: string;
  shippingAddress: string;
  product: string;
  size: string;
  quantity: number;
  total: string;
}) {
  const smtpEmail = process.env.SMTP_EMAIL;
  const smtpPassword = process.env.SMTP_PASSWORD;

  if (!smtpEmail || !smtpPassword) {
    logger.warn({ msg: "SMTP credentials not set, skipping email notification" });
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: smtpEmail,
      pass: smtpPassword,
    },
  });

  const html = `
    <div style="font-family: monospace; background: #111; color: #0ff; padding: 24px; border: 1px solid #0ff;">
      <h2 style="color: #0ff; border-bottom: 1px solid #333; padding-bottom: 12px;">
        НОВЕ ЗАМОВЛЕННЯ — GATHERING OF THE FALLEN
      </h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
        <tr><td style="padding: 8px; color: #888;">Товар:</td><td style="padding: 8px; color: #fff;">${order.product}</td></tr>
        <tr><td style="padding: 8px; color: #888;">Розмір:</td><td style="padding: 8px; color: #fff;">${order.size || "—"}</td></tr>
        <tr><td style="padding: 8px; color: #888;">Кількість:</td><td style="padding: 8px; color: #fff;">${order.quantity}</td></tr>
        <tr><td style="padding: 8px; color: #888;">Сума:</td><td style="padding: 8px; color: #0f0; font-weight: bold;">${order.total}</td></tr>
        <tr><td colspan="2" style="padding: 12px 0; border-top: 1px solid #333;"></td></tr>
        <tr><td style="padding: 8px; color: #888;">Ім'я:</td><td style="padding: 8px; color: #fff;">${order.customerName}</td></tr>
        <tr><td style="padding: 8px; color: #888;">Email:</td><td style="padding: 8px; color: #fff;">${order.email}</td></tr>
        <tr><td style="padding: 8px; color: #888;">Телефон:</td><td style="padding: 8px; color: #fff;">${order.phone || "—"}</td></tr>
        <tr><td style="padding: 8px; color: #888;">Адреса доставки:</td><td style="padding: 8px; color: #fff;">${order.shippingAddress}</td></tr>
      </table>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"GotF Merch" <${smtpEmail}>`,
      to: NOTIFICATION_EMAIL,
      subject: `Нове замовлення: ${order.product} x${order.quantity} — ${order.total}`,
      html,
    });
    logger.info({ msg: "Order notification email sent", to: NOTIFICATION_EMAIL });
  } catch (err: any) {
    logger.error({ msg: "Failed to send order email", error: err.message });
  }
}

router.post("/stripe/create-checkout", async (req: Request, res: Response) => {
  try {
    const { product, size, quantity, price } = req.body;

    if (!product || !price || !quantity) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const stripe = getStripe();

    const baseUrl = req.headers.origin || `https://${req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      currency: "cad",
      line_items: [
        {
          price_data: {
            currency: "cad",
            product_data: {
              name: product,
              description: size ? `Розмір: ${size}` : undefined,
            },
            unit_amount: Math.round(price * 100),
          },
          quantity,
        },
      ],
      shipping_address_collection: {
        allowed_countries: ["CA", "UA", "US", "PL", "DE"],
      },
      billing_address_collection: "required",
      phone_number_collection: {
        enabled: true,
      },
      metadata: {
        product,
        size: size || "",
        quantity: String(quantity),
      },
      success_url: `${baseUrl}/merch?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/merch?payment=cancelled`,
    });

    logger.info({
      msg: "Stripe checkout session created",
      sessionId: session.id,
      product,
      amount: price * quantity,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    logger.error({ msg: "Stripe checkout error", error: error.message });
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

function formatShippingAddress(shipping: Stripe.Checkout.Session.ShippingDetails | null): string {
  if (!shipping?.address) return "";
  const a = shipping.address;
  const parts = [
    shipping.name,
    a.line1,
    a.line2,
    a.city,
    a.state,
    a.postal_code,
    a.country,
  ].filter(Boolean);
  return parts.join(", ");
}

router.get("/stripe/verify-session", async (req: Request, res: Response) => {
  try {
    const sessionId = req.query.session_id as string;
    if (!sessionId) {
      return res.status(400).json({ error: "Missing session_id" });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      const meta = session.metadata || {};
      const total = `${((session.amount_total || 0) / 100).toFixed(2)} CAD`;
      const customerName = session.customer_details?.name || "";
      const customerEmail = session.customer_details?.email || "";
      const customerPhone = session.customer_details?.phone || "";
      const shippingAddress = formatShippingAddress(session.shipping_details);
      const shippingObj = session.shipping_details?.address;

      try {
        const dbResult = await pool.query(
          `INSERT INTO orders (product, size, quantity, total, first_name, last_name, email, phone, country, city, street, postal_code, comment, paypal_order_id, paypal_status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
           RETURNING id`,
          [
            meta.product,
            meta.size,
            Number(meta.quantity) || 1,
            total,
            customerName,
            "",
            customerEmail,
            customerPhone,
            shippingObj?.country || "",
            shippingObj?.city || "",
            [shippingObj?.line1, shippingObj?.line2].filter(Boolean).join(", "),
            shippingObj?.postal_code || "",
            null,
            session.payment_intent as string,
            "STRIPE_PAID",
          ]
        );
        logger.info({ msg: "Stripe order saved", orderId: dbResult.rows[0]?.id, sessionId });
      } catch (dbErr) {
        logger.error({ msg: "Failed to save Stripe order to DB", error: dbErr });
      }

      sendOrderEmail({
        customerName,
        email: customerEmail,
        phone: customerPhone,
        shippingAddress,
        product: meta.product || "",
        size: meta.size || "",
        quantity: Number(meta.quantity) || 1,
        total,
      }).catch(() => {});

      res.json({
        status: "paid",
        product: meta.product,
        size: meta.size,
        quantity: meta.quantity,
        total,
        customerName,
      });
    } else {
      res.json({ status: session.payment_status });
    }
  } catch (error: any) {
    logger.error({ msg: "Stripe verify error", error: error.message });
    res.status(500).json({ error: "Failed to verify session" });
  }
});

router.get("/stripe/publishable-key", (_req: Request, res: Response) => {
  const key = process.env.STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    return res.status(500).json({ error: "Stripe not configured" });
  }
  res.json({ publishableKey: key });
});

export default router;
