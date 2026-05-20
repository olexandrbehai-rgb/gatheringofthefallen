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
const CURRENCY = "cad";

type ProductId = "t-shirt" | "hoodie" | "bomber" | "cap";

interface ProductInfo {
  retail: number;
  printful_cost: number;
  name: string;
}

const PRODUCTS: Record<ProductId, ProductInfo> = {
  "t-shirt": { retail: 49, printful_cost: 24, name: "Футболка" },
  hoodie: { retail: 79, printful_cost: 42, name: "Худі" },
  bomber: { retail: 129, printful_cost: 70, name: "Бомбер" },
  cap: { retail: 45, printful_cost: 20, name: "Кепка" },
};

function calcStripeFee(totalCad: number): number {
  return Math.round((totalCad * 0.029 + 0.3) * 100) / 100;
}

function fmtCad(value: number): string {
  return `${value.toFixed(2)} CAD`;
}

async function sendOrderEmail(payload: {
  customerName: string;
  email: string;
  phone: string;
  shippingAddress: string;
  productName: string;
  productId: string;
  size: string;
  quantity: number;
  total: number;
  stripeFee: number;
  productionCost: number;
  netProfit: number;
}) {
  const smtpEmail = process.env.SMTP_EMAIL;
  const smtpPassword = process.env.SMTP_PASSWORD;

  if (!smtpEmail || !smtpPassword) {
    logger.warn({ msg: "SMTP credentials not set, skipping email notification" });
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: smtpEmail, pass: smtpPassword },
  });

  const profitColor = payload.netProfit >= 0 ? "#0f0" : "#f55";

  const html = `
    <div style="font-family: 'Courier New', monospace; background: #0a0a0a; color: #0ff; padding: 24px; border: 1px solid #0ff; max-width: 640px;">
      <h2 style="color: #0ff; border-bottom: 1px solid #333; padding-bottom: 12px; text-transform: uppercase; letter-spacing: 2px;">
        ⚡ Нове замовлення — Gathering Of The Fallen
      </h2>

      <h3 style="color: #b5179e; margin-top: 24px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px dashed #333; padding-bottom: 6px;">
        Замовлення
      </h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 6px 8px; color: #888;">Товар:</td><td style="padding: 6px 8px; color: #fff;">${payload.productName} <span style="color:#666;">(${payload.productId})</span></td></tr>
        <tr><td style="padding: 6px 8px; color: #888;">Розмір:</td><td style="padding: 6px 8px; color: #fff;">${payload.size || "—"}</td></tr>
        <tr><td style="padding: 6px 8px; color: #888;">Кількість:</td><td style="padding: 6px 8px; color: #fff;">${payload.quantity}</td></tr>
      </table>

      <h3 style="color: #b5179e; margin-top: 24px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px dashed #333; padding-bottom: 6px;">
        Покупець
      </h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 6px 8px; color: #888;">Ім'я:</td><td style="padding: 6px 8px; color: #fff;">${payload.customerName}</td></tr>
        <tr><td style="padding: 6px 8px; color: #888;">Email:</td><td style="padding: 6px 8px; color: #fff;">${payload.email}</td></tr>
        <tr><td style="padding: 6px 8px; color: #888;">Телефон:</td><td style="padding: 6px 8px; color: #fff;">${payload.phone || "—"}</td></tr>
        <tr><td style="padding: 6px 8px; color: #888;">Адреса доставки:</td><td style="padding: 6px 8px; color: #fff;">${payload.shippingAddress}</td></tr>
      </table>

      <h3 style="color: #b5179e; margin-top: 24px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px dashed #333; padding-bottom: 6px;">
        💰 Financial Summary
      </h3>
      <table style="width: 100%; border-collapse: collapse; background: #111; border: 1px solid #222;">
        <tr><td style="padding: 8px 12px; color: #888;">Total Paid:</td><td style="padding: 8px 12px; color: #fff; text-align: right; font-weight: bold;">${fmtCad(payload.total)}</td></tr>
        <tr><td style="padding: 8px 12px; color: #888;">Stripe Fee (2.9% + $0.30):</td><td style="padding: 8px 12px; color: #f99; text-align: right;">− ${fmtCad(payload.stripeFee)}</td></tr>
        <tr><td style="padding: 8px 12px; color: #888;">Production Cost (Printful):</td><td style="padding: 8px 12px; color: #f99; text-align: right;">− ${fmtCad(payload.productionCost)}</td></tr>
        <tr style="border-top: 2px solid #0ff;"><td style="padding: 12px; color: #0ff; font-weight: bold; text-transform: uppercase;">Your Net Profit:</td><td style="padding: 12px; color: ${profitColor}; text-align: right; font-weight: bold; font-size: 18px;">${fmtCad(payload.netProfit)}</td></tr>
      </table>

      <p style="color: #555; font-size: 11px; margin-top: 24px; text-align: center;">
        З руїн цивілізації. З попелу — вічність.
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"GotF Merch" <${smtpEmail}>`,
      to: NOTIFICATION_EMAIL,
      subject: `Нове замовлення: ${payload.productName} x${payload.quantity} — ${fmtCad(payload.total)} (profit ${fmtCad(payload.netProfit)})`,
      html,
    });
    logger.info({ msg: "Order notification email sent", to: NOTIFICATION_EMAIL });
  } catch (err: any) {
    logger.error({ msg: "Failed to send order email", error: err.message });
  }
}

router.post("/stripe/create-checkout", async (req: Request, res: Response): Promise<void> => {
  try {
    const { product_id, quantity } = req.body as {
      product_id?: string;
      quantity?: number;
    };
    const size = typeof req.body?.size === "string" ? req.body.size : "";

    if (
      !product_id ||
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 10
    ) {
      res.status(400).json({ error: "Invalid product_id or quantity" });
      return;
    }

    const product = PRODUCTS[product_id as ProductId];
    if (!product) {
      res.status(400).json({ error: "Unknown product_id" });
      return;
    }

    const stripe = getStripe();
    const baseUrl = req.headers.origin || `https://${req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      currency: CURRENCY,
      line_items: [
        {
          price_data: {
            currency: CURRENCY,
            product_data: {
              name: product.name,
              description: size ? `Розмір: ${size}` : undefined,
            },
            unit_amount: Math.round(product.retail * 100),
          },
          quantity,
        },
      ],
      shipping_address_collection: {
        allowed_countries: ["CA", "UA", "US", "PL", "DE"],
      },
      billing_address_collection: "required",
      phone_number_collection: { enabled: true },
      metadata: {
        product_id,
        product_name: product.name,
        size,
        quantity: String(quantity),
        printful_cost: String(product.printful_cost),
        retail: String(product.retail),
      },
      success_url: `${baseUrl}/merch?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/merch?payment=cancelled`,
    });

    logger.info({
      msg: "Stripe checkout session created",
      sessionId: session.id,
      product_id,
      retail: product.retail,
      quantity,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    logger.error({ msg: "Stripe checkout error", error: error.message });
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

interface ShippingAddressLike {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
}
interface ShippingDetailsLike {
  name?: string | null;
  address?: ShippingAddressLike | null;
}

function formatShippingAddress(shipping: ShippingDetailsLike | null | undefined): string {
  if (!shipping?.address) return "";
  const a = shipping.address;
  return [shipping.name, a.line1, a.line2, a.city, a.state, a.postal_code, a.country]
    .filter(Boolean)
    .join(", ");
}

function getShippingDetails(session: Stripe.Checkout.Session): ShippingDetailsLike | null {
  const s = session as unknown as { shipping_details?: ShippingDetailsLike | null; collected_information?: { shipping_details?: ShippingDetailsLike | null } };
  return s.shipping_details ?? s.collected_information?.shipping_details ?? null;
}

async function processPaidSession(session: Stripe.Checkout.Session) {
  const meta = session.metadata || {};
  const productId = (meta.product_id || "") as string;
  const productInfo = PRODUCTS[productId as ProductId];
  const productName = productInfo?.name || meta.product_name || productId || "Unknown";
  const printfulCost =
    productInfo?.printful_cost ?? Number(meta.printful_cost) ?? 0;
  const quantity = Number(meta.quantity) || 1;
  const size = meta.size || "";

  const total = (session.amount_total || 0) / 100;
  const stripeFee = calcStripeFee(total);
  const productionCost = Math.round(printfulCost * quantity * 100) / 100;
  const netProfit = Math.round((total - stripeFee - productionCost) * 100) / 100;

  const customerName = session.customer_details?.name || "";
  const customerEmail = session.customer_details?.email || "";
  const customerPhone = session.customer_details?.phone || "";
  const shippingDetails = getShippingDetails(session);
  const shippingAddress = formatShippingAddress(shippingDetails);
  const shippingObj = shippingDetails?.address;

  const dbResult = await pool.query(
    `INSERT INTO orders (
       product, product_id, size, quantity, total,
       first_name, last_name, email, phone,
       country, city, street, postal_code,
       comment, paypal_order_id, paypal_status,
       stripe_session_id, stripe_fee, production_cost, net_profit
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20
     )
     ON CONFLICT (stripe_session_id) DO NOTHING
     RETURNING id`,
    [
      productName,
      productId,
      size,
      quantity,
      fmtCad(total),
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
      session.id,
      stripeFee,
      productionCost,
      netProfit,
    ],
  );

  if (dbResult.rowCount === 0) {
    logger.info({
      msg: "Stripe order already recorded, skipping email (idempotent replay)",
      sessionId: session.id,
    });
    return { alreadyProcessed: true, total, stripeFee, productionCost, netProfit, productName, size, quantity, customerName };
  }

  logger.info({
    msg: "Stripe order saved",
    orderId: dbResult.rows[0]?.id,
    sessionId: session.id,
    total,
    netProfit,
  });

  await sendOrderEmail({
    customerName,
    email: customerEmail,
    phone: customerPhone,
    shippingAddress,
    productName,
    productId,
    size,
    quantity,
    total,
    stripeFee,
    productionCost,
    netProfit,
  });

  return { alreadyProcessed: false, total, stripeFee, productionCost, netProfit, productName, size, quantity, customerName };
}

async function updateOrderStatusByPaymentIntent(piId: string, status: string) {
  const result = await pool.query(
    `UPDATE orders SET paypal_status = $1 WHERE paypal_order_id = $2 RETURNING id`,
    [status, piId],
  );
  return result.rowCount ?? 0;
}

async function stripeWebhookHandler(req: Request, res: Response): Promise<void> {
  const sig = req.headers["stripe-signature"] as string | undefined;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logger.error({ msg: "STRIPE_WEBHOOK_SECRET not set; rejecting webhook" });
    res.status(500).send("Webhook not configured");
    return;
  }
  if (!sig) {
    res.status(400).send("Missing stripe-signature header");
    return;
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, webhookSecret);
  } catch (err: any) {
    logger.error({ msg: "Stripe webhook signature verification failed", error: err.message });
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status === "paid") {
          await processPaidSession(session);
        } else {
          logger.info({
            msg: "Webhook: session completed but not paid",
            sessionId: session.id,
            payment_status: session.payment_status,
          });
        }
        break;
      }
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const updated = await updateOrderStatusByPaymentIntent(pi.id, "STRIPE_PAID");
        logger.info({ msg: "payment_intent.succeeded", paymentIntent: pi.id, rowsUpdated: updated });
        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const updated = await updateOrderStatusByPaymentIntent(pi.id, "STRIPE_FAILED");
        logger.warn({
          msg: "payment_intent.payment_failed",
          paymentIntent: pi.id,
          rowsUpdated: updated,
          reason: pi.last_payment_error?.message,
        });
        break;
      }
      default:
        logger.debug({ msg: "Unhandled Stripe event type", type: event.type });
    }
    res.json({ received: true });
  } catch (err: any) {
    logger.error({ msg: "Error processing webhook event", error: err.message });
    res.status(500).send("Webhook handler error");
  }
}

router.post("/stripe/webhook", stripeWebhookHandler);
router.post("/webhook/stripe", stripeWebhookHandler);

router.get("/stripe/verify-session", async (req: Request, res: Response): Promise<void> => {
  try {
    const sessionId = req.query.session_id as string;
    if (!sessionId) {
      res.status(400).json({ error: "Missing session_id" });
      return;
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      const meta = session.metadata || {};
      const productInfo = PRODUCTS[(meta.product_id || "") as ProductId];
      const productName = productInfo?.name || meta.product_name || "";
      const total = (session.amount_total || 0) / 100;
      res.json({
        status: "paid",
        product: productName,
        size: meta.size,
        quantity: meta.quantity,
        total: fmtCad(total),
        customerName: session.customer_details?.name || "",
      });
    } else {
      res.json({ status: session.payment_status });
    }
  } catch (error: any) {
    logger.error({ msg: "Stripe verify error", error: error.message });
    res.status(500).json({ error: "Failed to verify session" });
  }
});

router.get("/stripe/publishable-key", (_req: Request, res: Response): void => {
  const key =
    process.env.VITE_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    res.status(500).json({ error: "Stripe not configured" });
    return;
  }
  res.json({ publishableKey: key });
});

export default router;
