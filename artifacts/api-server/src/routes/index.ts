import { Router, type IRouter } from "express";
import healthRouter from "./health";
import ordersRouter from "./orders";
import cartOrderRouter from "./cart-order";
import stripeRouter from "./stripe";

const router: IRouter = Router();

router.use(healthRouter);
router.use(ordersRouter);
router.use(cartOrderRouter);
router.use(stripeRouter);

export default router;
