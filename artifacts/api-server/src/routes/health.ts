import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { getTrustedDeviceCleanupHealth } from "../middleware/ownerAuth";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse(getTrustedDeviceCleanupHealth());
  res.status(data.status === "degraded" ? 503 : 200).json(data);
});

export default router;
