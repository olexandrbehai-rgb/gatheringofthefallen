import { Router, type Request, type Response } from "express";
import Stripe from "stripe";
import { Pool } from "pg";
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

router.post("/stripe/create-checkout", async (req: Request, res: Response) => {
  try {
    const { product, size, quantity, price, customer } = req.body;

    if (!product || !price || !quantity) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const stripe = getStripe();

    const baseUrl = req.headers.origin || `https://${req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      currency: "cad",
      customer_email: customer?.email || undefined,
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
      metadata: {
        product,
        size: size || "",
        quantity: String(quantity),
        firstName: customer?.firstName || "",
        lastName: customer?.lastName || "",
        phone: customer?.phone || "",
        country: customer?.country || "",
        city: customer?.city || "",
        street: customer?.street || "",
        postalCode: customer?.postalCode || "",
        comment: customer?.comment || "",
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

      try {
        const dbResult = await pool.query(
          `INSERT INTO orders (product, size, quantity, total, first_name, last_name, email, phone, country, city, street, postal_code, comment, paypal_order_id, paypal_status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
           RETURNING id`,
          [
            meta.product, meta.size, Number(meta.quantity) || 1, total,
            meta.firstName, meta.lastName, session.customer_email || session.customer_details?.email || "",
            meta.phone, meta.country, meta.city, meta.street, meta.postalCode,
            meta.comment || null,
            session.payment_intent as string, "STRIPE_PAID",
          ]
        );
        logger.info({ msg: "Stripe order saved", orderId: dbResult.rows[0]?.id, sessionId });
      } catch (dbErr) {
        logger.error({ msg: "Failed to save Stripe order to DB", error: dbErr });
      }

      res.json({
        status: "paid",
        product: meta.product,
        size: meta.size,
        quantity: meta.quantity,
        total,
        customerName: `${meta.firstName} ${meta.lastName}`.trim(),
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
