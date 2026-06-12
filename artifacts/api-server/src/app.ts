import path from "node:path";
import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
const ALLOWED_ORIGINS = new Set([
  "https://gathering-of-the-fallen.replit.app",
  "http://localhost:5000",
  "http://localhost:80",
]);
const EXTRA_ALLOWED_ORIGINS = process.env.CORS_ORIGINS?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean) ?? [];
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.has(origin)) return callback(null, true);
      if (EXTRA_ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      if (/^https:\/\/[a-z0-9-]+\.replit\.dev$/i.test(origin)) return callback(null, true);
      if (/^https:\/\/[a-z0-9-]+\.replit\.app$/i.test(origin)) return callback(null, true);
      if (/^https:\/\/[a-z0-9-]+\.onrender\.com$/i.test(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  }),
);

app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));
app.use("/api/webhook/stripe", express.raw({ type: "application/json" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

if (process.env.NODE_ENV === "production") {
  const clientDir = path.resolve(import.meta.dirname, "../../web/dist/public");
  app.use(express.static(clientDir));
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(clientDir, "index.html"));
  });
}

export default app;
