import { Router, type IRouter } from "express";
import healthRouter from "./health";
import ordersRouter from "./orders";
import cartOrderRouter from "./cart-order";
import stripeRouter from "./stripe";
import activityRouter from "./activity";
import oracleRouter from "./oracle";
import authorsWorldRouter from "./authors-world";

const router: IRouter = Router();

router.use(healthRouter);
router.use(ordersRouter);
router.use(cartOrderRouter);
router.use(stripeRouter);
router.use(activityRouter);
router.use(oracleRouter);
router.use(authorsWorldRouter);

export default router;
