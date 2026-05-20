import { Router, type Request, type Response } from "express";
import { Pool } from "pg";
import nodemailer from "nodemailer";
import { z } from "zod";
import { logger } from "../lib/logger";

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const NOTIFICATION_EMAIL = "tetianabehai@gmail.com";

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

interface OrderCtx {
  customer: z.infer<typeof CartOrderSchema>["customer"];
  items: PricedItem[];
  currency: Currency;
  totalLocal: number;
  totalCad: number;
}

function buildEmailHtml(order: OrderCtx, orderId: number): string {
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

  return `
    <div style="font-family:'Courier New',monospace;background:#0a0a0a;color:#eee;padding:24px;border:1px solid #00f0ff;max-width:680px;">
      <h2 style="color:#00f0ff;border-bottom:1px solid #333;padding-bottom:12px;text-transform:uppercase;letter-spacing:2px;">
        ⚡ Нове замовлення #${orderId} — Gathering Of The Fallen
      </h2>
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

async function sendOrderEmail(order: OrderCtx, orderId: number): Promise<boolean> {
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
    subject: `Нове замовлення #${orderId}: ${formatMoney(order.totalLocal, order.currency)} (${order.items.length} поз.)`,
    html: buildEmailHtml(order, orderId),
  });
  return true;
}

router.post("/cart-order", async (req: Request, res: Response): Promise<void> => {
  const parsed = CartOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: "Невалідні дані замовлення" });
    return;
  }

  try {
    const { customer, items: rawItems } = parsed.data;
    const currency = customer.currency as Currency;

    const items: PricedItem[] = [];
    for (const raw of rawItems) {
      const size = (raw.size || "").toUpperCase();
      if (size && !ALLOWED_SIZES.has(size)) {
        res.status(400).json({ success: false, message: `Невірний розмір: ${size}` });
        return;
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
        "CART_PENDING",
      ],
    );

    const orderId = dbResult.rows[0]?.id as number;
    logger.info({ msg: "Cart order saved", orderId, items: items.length, currency, totalLocal, totalCad });

    const ctx: OrderCtx = { customer, items, currency, totalLocal, totalCad };
    let emailSent = false;
    try {
      emailSent = await sendOrderEmail(ctx, orderId);
    } catch (err: any) {
      logger.error({ msg: "Cart order email failed", error: err?.message });
    }

    res.json({
      success: true,
      orderId,
      emailSent,
      totals: { currency, local: totalLocal, cad: totalCad },
    });
  } catch (error: any) {
    logger.error({ msg: "Cart order error", error: error?.message });
    res.status(500).json({ success: false, message: "Internal error" });
  }
});

export default router;
