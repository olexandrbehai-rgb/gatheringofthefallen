import { Router, type Request, type Response } from "express";
import { Pool } from "pg";
import nodemailer from "nodemailer";
import Stripe from "stripe";
import { z } from "zod";
import { logger } from "../lib/logger";

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const NOTIFICATION_EMAIL = "tetianabehai@gmail.com";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
}

type ProductType = "tee-basic" | "tee-premium" | "hoodie" | "bomber";
type Currency = "CAD" | "UAH" | "USD" | "PLN";

const PRICE_TABLE: Record<ProductType, Record<Currency, number>> = {
  "tee-basic":   { CAD: 45,  UAH: 1650, USD: 33,  PLN: 135 },
  "tee-premium": { CAD: 58,  UAH: 2100, USD: 43,  PLN: 174 },
  "hoodie":      { CAD: 95,  UAH: 3500, USD: 70,  PLN: 285 },
  "bomber":      { CAD: 185, UAH: 6800, USD: 136, PLN: 555 },
};

const CURRENCY_SYMBOL: Record<Currency, string> = {
  CAD: "CA$",
  UAH: "₴",
  USD: "$",
  PLN: "zł",
};

const ALLOWED_SIZES = new Set(["XS", "S", "M", "L", "XL", "XXL"]);

const CartOrderSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().email().max(200),
    phone: z.string().trim().min(3).max(40),
    country: z.string().trim().min(1).max(80),
    countryCode: z.string().trim().min(1).max(8),
    currency: z.enum(["CAD", "UAH", "USD", "PLN"]),
    city: z.string().trim().min(1).max(120),
    street: z.string().trim().min(1).max(200),
    postalCode: z.string().trim().min(1).max(40),
  }),
  items: z
    .array(
      z.object({
        productId: z.string().min(1).max(80),
        productType: z.enum(["tee-basic", "tee-premium", "hoodie", "bomber"]),
        name: z.string().min(1).max(200),
        size: z.string().max(8).optional().default(""),
        qty: z.number().int().min(1).max(20),
      }),
    )
    .min(1)
    .max(30),
});

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatMoney(amount: number, currency: Currency): string {
  if (currency === "UAH" || currency === "PLN") {
    return `${Math.round(amount)} ${CURRENCY_SYMBOL[currency]}`;
  }
  return `${CURRENCY_SYMBOL[currency]}${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`;
}

interface PricedItem {
  productId: string;
  productType: ProductType;
  name: string;
  size: string;
  qty: number;
  unitLocal: number;
  subtotalLocal: number;
  unitCad: number;
  subtotalCad: number;
}

interface CustomerInput {
  name: string;
  email: string;
  phone: string;
  country: string;
  countryCode: string;
  currency: Currency;
  city: string;
  street: string;
  postalCode: string;
}

interface OrderCtx {
  customer: CustomerInput;
  items: PricedItem[];
  currency: Currency;
  totalLocal: number;
  totalCad: number;
}

function priceItems(rawItems: z.infer<typeof CartOrderSchema>["items"], currency: Currency):
  | { ok: true; items: PricedItem[]; totalLocal: number; totalCad: number }
  | { ok: false; message: string } {
  const items: PricedItem[] = [];
  for (const raw of rawItems) {
    const size = (raw.size || "").toUpperCase();
    if (size && !ALLOWED_SIZES.has(size)) {
      return { ok: false, message: `Невірний розмір: ${size}` };
    }
    const unitLocal = PRICE_TABLE[raw.productType][currency];
    const unitCad = PRICE_TABLE[raw.productType]["CAD"];
    items.push({
      productId: raw.productId,
      productType: raw.productType,
      name: raw.name.slice(0, 200),
      size,
      qty: raw.qty,
      unitLocal,
      subtotalLocal: unitLocal * raw.qty,
      unitCad,
      subtotalCad: unitCad * raw.qty,
    });
  }
  const totalLocal = items.reduce((s, i) => s + i.subtotalLocal, 0);
  const totalCad = items.reduce((s, i) => s + i.subtotalCad, 0);
  return { ok: true, items, totalLocal, totalCad };
}

function buildEmailHtml(order: OrderCtx, orderId: number, paid: boolean): string {
  const { customer, items, currency, totalLocal, totalCad } = order;
  const rows = items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 12px;border-top:1px solid #222;color:#fff;">${escapeHtml(i.name)}</td>
        <td style="padding:8px 12px;border-top:1px solid #222;color:#ccc;text-align:center;">${escapeHtml(i.size || "—")}</td>
        <td style="padding:8px 12px;border-top:1px solid #222;color:#ccc;text-align:center;">${i.qty}</td>
        <td style="padding:8px 12px;border-top:1px solid #222;color:#00f0ff;text-align:right;">
          ${formatMoney(i.subtotalLocal, currency)}
          ${currency !== "CAD" ? `<div style="color:#666;font-size:11px;">≈ ${formatMoney(i.subtotalCad, "CAD")}</div>` : ""}
        </td>
      </tr>`,
    )
    .join("");

  const statusBadge = paid
    ? `<span style="display:inline-block;padding:4px 10px;background:#0a4d2e;color:#22ff88;border:1px solid #22ff88;font-size:11px;letter-spacing:2px;">ОПЛАЧЕНО ✓ STRIPE</span>`
    : `<span style="display:inline-block;padding:4px 10px;background:#4d3a0a;color:#ffcc22;border:1px solid #ffcc22;font-size:11px;letter-spacing:2px;">ОЧІКУЄ ОПЛАТИ</span>`;

  return `
    <div style="font-family:'Courier New',monospace;background:#0a0a0a;color:#eee;padding:24px;border:1px solid #00f0ff;max-width:680px;">
      <h2 style="color:#00f0ff;border-bottom:1px solid #333;padding-bottom:12px;text-transform:uppercase;letter-spacing:2px;">
        ⚡ Замовлення #${orderId} — Gathering Of The Fallen
      </h2>
      <p style="margin:12px 0;">${statusBadge}</p>
      <h3 style="color:#b5179e;margin-top:24px;text-transform:uppercase;letter-spacing:1px;">Покупець</h3>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:4px 8px;color:#888;">Ім'я:</td><td style="padding:4px 8px;color:#fff;">${escapeHtml(customer.name)}</td></tr>
        <tr><td style="padding:4px 8px;color:#888;">Email:</td><td style="padding:4px 8px;color:#fff;">${escapeHtml(customer.email)}</td></tr>
        <tr><td style="padding:4px 8px;color:#888;">Телефон:</td><td style="padding:4px 8px;color:#fff;">${escapeHtml(customer.phone)}</td></tr>
        <tr><td style="padding:4px 8px;color:#888;">Країна:</td><td style="padding:4px 8px;color:#fff;">${escapeHtml(customer.country)}</td></tr>
        <tr><td style="padding:4px 8px;color:#888;">Адреса:</td><td style="padding:4px 8px;color:#fff;">${escapeHtml(customer.street)}, ${escapeHtml(customer.city)}, ${escapeHtml(customer.postalCode)}</td></tr>
      </table>
      <h3 style="color:#b5179e;margin-top:24px;text-transform:uppercase;letter-spacing:1px;">Товари</h3>
      <table style="width:100%;border-collapse:collapse;background:#111;border:1px solid #222;">
        <thead>
          <tr style="background:#1a1a1a;">
            <th style="padding:8px 12px;text-align:left;color:#888;font-size:11px;text-transform:uppercase;">Товар</th>
            <th style="padding:8px 12px;text-align:center;color:#888;font-size:11px;text-transform:uppercase;">Розмір</th>
            <th style="padding:8px 12px;text-align:center;color:#888;font-size:11px;text-transform:uppercase;">К-сть</th>
            <th style="padding:8px 12px;text-align:right;color:#888;font-size:11px;text-transform:uppercase;">Сума</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr style="border-top:2px solid #00f0ff;background:#0a0a0a;">
            <td colspan="3" style="padding:12px;color:#00f0ff;font-weight:bold;text-transform:uppercase;">Всього (${currency}):</td>
            <td style="padding:12px;color:#00f0ff;text-align:right;font-weight:bold;font-size:18px;">${formatMoney(totalLocal, currency)}</td>
          </tr>
          ${
            currency !== "CAD"
              ? `<tr style="background:#0a0a0a;">
                  <td colspan="3" style="padding:8px 12px;color:#888;text-transform:uppercase;">Еквівалент (CAD):</td>
                  <td style="padding:8px 12px;color:#fff;text-align:right;font-weight:bold;">${formatMoney(totalCad, "CAD")}</td>
                </tr>`
              : ""
          }
        </tfoot>
      </table>
      <p style="color:#555;font-size:11px;margin-top:24px;text-align:center;">З руїн цивілізації. З попелу — вічність.</p>
    </div>
  `;
}

async function sendOrderEmail(order: OrderCtx, orderId: number, paid: boolean): Promise<boolean> {
  const user = process.env.SMTP_EMAIL;
  const pass = process.env.SMTP_PASSWORD;
  if (!user || !pass) {
    logger.warn({ msg: "SMTP credentials not set; skipping email" });
    return false;
  }
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  await transporter.sendMail({
    from: `"GtF Merch" <${user}>`,
    to: NOTIFICATION_EMAIL,
    replyTo: order.customer.email,
    subject: `${paid ? "💰 ОПЛАЧЕНО" : "Нове"} замовлення #${orderId}: ${formatMoney(order.totalLocal, order.currency)} (${order.items.length} поз.)`,
    html: buildEmailHtml(order, orderId, paid),
  });
  return true;
}

function buildOrderCtxFromRaw(
  customer: CustomerInput,
  rawItems: z.infer<typeof CartOrderSchema>["items"],
): { ok: true; ctx: OrderCtx } | { ok: false; message: string } {
  const currency = customer.currency;
  const priced = priceItems(rawItems, currency);
  if (!priced.ok) return { ok: false, message: priced.message };
  return {
    ok: true,
    ctx: { customer, items: priced.items, currency, totalLocal: priced.totalLocal, totalCad: priced.totalCad },
  };
}

async function insertOrder(
  ctx: OrderCtx,
  paymentMethod: "MANUAL" | "STRIPE_PENDING",
): Promise<number> {
  const { customer, items, currency, totalLocal, totalCad } = ctx;
  const productSummary = items.map((i) => `${i.name} (${i.size || "—"}) × ${i.qty}`).join("\n");
  const sizesSummary = items.map((i) => i.size || "—").join(", ");
  const totalQty = items.reduce((s, i) => s + i.qty, 0);
  const [firstName, ...rest] = customer.name.split(/\s+/);
  const lastName = rest.join(" ");
  const totalDisplay = `${formatMoney(totalLocal, currency)}${currency !== "CAD" ? ` (≈ ${formatMoney(totalCad, "CAD")})` : ""}`;

  const dbResult = await pool.query(
    `INSERT INTO orders
       (product, size, quantity, total, first_name, last_name, email, phone,
        country, city, street, postal_code, comment, paypal_order_id, paypal_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING id`,
    [
      productSummary,
      sizesSummary,
      totalQty,
      totalDisplay,
      firstName || customer.name,
      lastName,
      customer.email,
      customer.phone,
      customer.country,
      customer.city,
      customer.street,
      customer.postalCode,
      `Currency: ${currency} | Local: ${totalLocal} | CAD: ${totalCad} | Items: ${JSON.stringify(items)}`,
      null,
      paymentMethod === "STRIPE_PENDING" ? "STRIPE_PENDING" : "CART_PENDING",
    ],
  );
  return dbResult.rows[0]?.id as number;
}

// Stripe supports many currencies including CAD, USD, PLN, UAH.
const STRIPE_CURRENCY: Record<Currency, string> = {
  CAD: "cad",
  USD: "usd",
  PLN: "pln",
  UAH: "uah",
};

router.post("/cart-stripe-checkout", async (req: Request, res: Response): Promise<void> => {
  const parsed = CartOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: "Невалідні дані замовлення" });
    return;
  }

  try {
    const built = buildOrderCtxFromRaw(parsed.data.customer, parsed.data.items);
    if (!built.ok) {
      res.status(400).json({ success: false, message: built.message });
      return;
    }
    const ctx = built.ctx;

    const orderId = await insertOrder(ctx, "STRIPE_PENDING");
    logger.info({ msg: "Cart order pending Stripe", orderId, totalLocal: ctx.totalLocal, currency: ctx.currency });

    const stripe = getStripe();
    const baseUrl = req.headers.origin || `https://${req.headers.host}`;
    const stripeCurrency = STRIPE_CURRENCY[ctx.currency];

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      currency: stripeCurrency,
      customer_email: ctx.customer.email,
      line_items: ctx.items.map((i) => ({
        price_data: {
          currency: stripeCurrency,
          product_data: {
            name: i.name,
            description: i.size ? `Розмір: ${i.size}` : undefined,
          },
          unit_amount: Math.round(i.unitLocal * 100),
        },
        quantity: i.qty,
      })),
      metadata: {
        flow: "cart",
        order_id: String(orderId),
      },
      success_url: `${baseUrl}/merch?payment=success&order_id=${orderId}`,
      cancel_url: `${baseUrl}/merch?payment=cancelled&order_id=${orderId}`,
    });

    await pool.query(
      `UPDATE orders SET paypal_order_id = $1 WHERE id = $2`,
      [session.id, orderId],
    );

    logger.info({ msg: "Stripe cart session created", orderId, sessionId: session.id });
    res.json({ success: true, url: session.url, orderId });
  } catch (error: any) {
    logger.error({ msg: "Cart Stripe checkout error", error: error?.message });
    res.status(500).json({ success: false, message: "Не вдалося створити сесію оплати" });
  }
});

// Called from the Stripe webhook when a cart-flow checkout session is paid.
export async function processCartPaidSession(session: Stripe.Checkout.Session): Promise<void> {
  const orderIdRaw = session.metadata?.order_id;
  const orderId = orderIdRaw ? Number(orderIdRaw) : NaN;
  if (!orderId || Number.isNaN(orderId)) {
    logger.warn({ msg: "Cart paid session missing order_id metadata", sessionId: session.id });
    return;
  }

  const upd = await pool.query(
    `UPDATE orders SET paypal_status = 'STRIPE_PAID' WHERE id = $1 AND paypal_status <> 'STRIPE_PAID' RETURNING id, comment, first_name, last_name, email, phone, country, city, street, postal_code`,
    [orderId],
  );
  if (upd.rowCount === 0) {
    logger.info({ msg: "Cart order already marked paid (idempotent)", orderId, sessionId: session.id });
    return;
  }

  const row = upd.rows[0] as {
    id: number;
    comment: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    country: string;
    city: string;
    street: string;
    postal_code: string;
  };

  const match = /Items: (\[.*\])$/s.exec(row.comment || "");
  if (!match) {
    logger.error({ msg: "Cart order comment missing items JSON", orderId });
    return;
  }
  let items: PricedItem[];
  try {
    items = JSON.parse(match[1]);
  } catch {
    logger.error({ msg: "Cart order comment has invalid items JSON", orderId });
    return;
  }

  const currMatch = /Currency: (\w+)/.exec(row.comment || "");
  const currency = (currMatch?.[1] as Currency) || "CAD";
  const totalLocal = items.reduce((s, i) => s + i.subtotalLocal, 0);
  const totalCad = items.reduce((s, i) => s + i.subtotalCad, 0);

  const ctx: OrderCtx = {
    customer: {
      name: `${row.first_name} ${row.last_name}`.trim(),
      email: row.email,
      phone: row.phone,
      country: row.country,
      countryCode: "",
      currency,
      city: row.city,
      street: row.street,
      postalCode: row.postal_code,
    },
    items,
    currency,
    totalLocal,
    totalCad,
  };

  try {
    await sendOrderEmail(ctx, orderId, true);
    logger.info({ msg: "Cart paid email sent", orderId });
  } catch (err: any) {
    logger.error({ msg: "Cart paid email failed", orderId, error: err?.message });
  }
}

router.post("/cart-order", async (req: Request, res: Response): Promise<void> => {
  const parsed = CartOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: "Невалідні дані замовлення" });
    return;
  }

  try {
    const built = buildOrderCtxFromRaw(parsed.data.customer, parsed.data.items);
    if (!built.ok) {
      res.status(400).json({ success: false, message: built.message });
      return;
    }
    const ctx = built.ctx;
    const orderId = await insertOrder(ctx, "MANUAL");
    logger.info({ msg: "Cart order saved (manual)", orderId, totalLocal: ctx.totalLocal, currency: ctx.currency });

    let emailSent = false;
    try {
      emailSent = await sendOrderEmail(ctx, orderId, false);
    } catch (err: any) {
      logger.error({ msg: "Cart order email failed", error: err?.message });
    }

    res.json({
      success: true,
      orderId,
      emailSent,
      totals: { currency: ctx.currency, local: ctx.totalLocal, cad: ctx.totalCad },
    });
  } catch (error: any) {
    logger.error({ msg: "Cart order error", error: error?.message });
    res.status(500).json({ success: false, message: "Internal error" });
  }
});

export default router;
