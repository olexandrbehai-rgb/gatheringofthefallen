import { Router, type IRouter } from "express";
import healthRouter from "./health";
import ordersRouter from "./orders";
import stripeRouter from "./stripe";

const router: IRouter = Router();

router.use(healthRouter);
router.use(ordersRouter);
router.use(stripeRouter);

export default router;
