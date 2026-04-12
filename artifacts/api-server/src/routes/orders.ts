import { Router, type Request, type Response } from "express";
import { logger } from "../lib/logger";

const router = Router();

router.post("/order-notification", async (req: Request, res: Response) => {
  try {
    const { product, size, quantity, total, customer, paypalOrderId, paypalStatus } = req.body;

    logger.info({
      msg: "New merch order received",
      product,
      size,
      quantity,
      total,
      customerEmail: customer?.email,
      customerCountry: customer?.country,
      customerCity: customer?.city,
      paypalOrderId,
      paypalStatus,
    });

    res.json({
      success: true,
      message: "Order notification logged",
      orderId: paypalOrderId,
    });
  } catch (error) {
    logger.error({ msg: "Order notification error", error });
    res.status(500).json({ success: false, message: "Internal error" });
  }
});

export default router;
