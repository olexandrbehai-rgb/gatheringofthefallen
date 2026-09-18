import path from "node:path";
import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import router from "./routes";
import { logger } from "./lib/logger";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";

const app: Express = express();

// Trust the platform's forwarding headers so per-client protections see the
// visitor address instead of the shared reverse proxy address.
app.set("trust proxy", true);

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
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
const ALLOWED_ORIGINS = new Set([
  "https://gathering-of-the-fallen.replit.app",
  "https://gatheringofthefallen.com",
  "https://www.gatheringofthefallen.com",
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
       if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) return callback(null, true);
       if (/^https:\/\/[a-z0-9.-]+\.replit\.dev$/i.test(origin)) return callback(null, true);
       if (/^https:\/\/[a-z0-9.-]+\.replit\.app$/i.test(origin)) return callback(null, true);
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

if (process.env.CLERK_SECRET_KEY && process.env.CLERK_PUBLISHABLE_KEY) {
  app.use(
    clerkMiddleware((req) => ({
      publishableKey: publishableKeyFromHost(
        getClerkProxyHost(req) ?? "",
        process.env.CLERK_PUBLISHABLE_KEY,
      ),
    })),
  );
}

app.use("/api", router);

if (process.env.NODE_ENV === "production") {
  const clientDir = path.resolve(import.meta.dirname, "../../web/dist/public");
  const noStore = "no-store, no-cache, must-revalidate, proxy-revalidate";
  app.use(
    express.static(clientDir, {
      setHeaders(res, filePath) {
        if (path.basename(filePath) === "index.html") {
          res.setHeader("Cache-Control", noStore);
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
        } else if (
          /[-.][a-z0-9_-]{8,}\.[a-z0-9]+$/i.test(path.basename(filePath))
        ) {
          res.setHeader(
            "Cache-Control",
            "public, max-age=31536000, immutable",
          );
        } else {
          res.setHeader("Cache-Control", noStore);
        }
      },
    }),
  );
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    if (req.path.startsWith("/api")) return next();
    res.setHeader("Cache-Control", noStore);
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.sendFile(path.join(clientDir, "index.html"));
  });
}

export default app;
