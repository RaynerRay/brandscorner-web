import express from "express";
import cors from "cors";
import proxy from "express-http-proxy";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import initializeSiteConfig from "./libs/initializeSiteConfig";

const app = express();

const isProduction = process.env.NODE_ENV === "production";

const allowedOrigins = isProduction
  ? [
      "https://brandscorner.co.zw",
      "https://www.brandscorner.co.zw",
      "https://sellers.brandscorner.co.zw",
      "https://admin.brandscorner.co.zw",
    ]
  : ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"];

app.use(
  cors({
    origin: allowedOrigins,
    allowedHeaders: ["Authorization", "Content-Type", "X-Requested-With"],
    credentials: true,
  })
);

app.use(morgan(isProduction ? "combined" : "dev"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());
app.set("trust proxy", isProduction ? "loopback" : 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: "Too many requests, please try again later!" },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => req.ip,
  skip: (req) => req.path === "/gateway-health",
});

app.use(limiter);

app.get("/gateway-health", (req, res) => {
  res.status(200).json({
    message: "API Gateway is healthy!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

const getServiceUrl = (serviceName: string, port: number) => {
  return isProduction
    ? `http://${serviceName}:${port}`
    : `http://localhost:${port}`;
};

const createProxyMiddleware = (serviceUrl: string, serviceName: string) => {
  return proxy(serviceUrl, {
    timeout: 30000,
    proxyReqOptDecorator: (
      proxyReqOpts: { headers: any },
      srcReq: any
    ) => {
      // Forward original IP
      proxyReqOpts.headers["X-Forwarded-For"] = srcReq.ip;
      proxyReqOpts.headers["X-Original-Host"] = srcReq.get("host");

      // ── Forward cookies so isAuthenticated works in every service ──
      if (srcReq.headers.cookie) {
        proxyReqOpts.headers["cookie"] = srcReq.headers.cookie;
      }

      // Forward Authorization header if present (Bearer token fallback)
      if (srcReq.headers.authorization) {
        proxyReqOpts.headers["authorization"] = srcReq.headers.authorization;
      }

      return proxyReqOpts;
    },
    // Forward Set-Cookie headers from services back to the browser
    userResHeaderDecorator: (
      headers: any,
      _userReq: any,
      _userRes: any,
      _proxyReq: any,
      proxyRes: any
    ) => {
      if (proxyRes.headers["set-cookie"]) {
        headers["set-cookie"] = proxyRes.headers["set-cookie"];
      }
      return headers;
    },
    proxyErrorHandler: (
      err: { message: any },
      res: any,
      next: any
    ) => {
      console.error(`Proxy error for ${serviceName}:`, err.message);
      if (!res.headersSent) {
        res.status(503).json({
          error: "Service temporarily unavailable",
          service: serviceName,
          timestamp: new Date().toISOString(),
        });
      }
    },
  });
};

app.use("/recommendation", createProxyMiddleware(getServiceUrl("recommendation-service", 6007), "recommendation-service"));
app.use("/chatting",        createProxyMiddleware(getServiceUrl("chatting-service", 6006),        "chatting-service"));
app.use("/admin",           createProxyMiddleware(getServiceUrl("admin-service", 6005),           "admin-service"));
app.use("/order",           createProxyMiddleware(getServiceUrl("order-service", 6004),           "order-service"));
app.use("/seller",          createProxyMiddleware(getServiceUrl("seller-service", 6003),          "seller-service"));
app.use("/product",         createProxyMiddleware(getServiceUrl("product-service", 6002),         "product-service"));
app.use("/auth",            createProxyMiddleware(getServiceUrl("auth-service", 6001),            "auth-service"));

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Global error handler:", err);
  if (!res.headersSent) {
    res.status(500).json({
      error: isProduction ? "Internal server error" : err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
});

const port = process.env.PORT || 8080;
const host = isProduction ? "0.0.0.0" : "localhost";

const server = app.listen(Number(port), host, () => {
  console.log(`🚀 API Gateway listening at http://${host}:${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 CORS Origins: ${JSON.stringify(allowedOrigins)}`);
  try {
    initializeSiteConfig();
    console.log("✅ Site config initialized successfully!");
  } catch (error) {
    console.error("❌ Failed to initialize site config:", error);
  }
});

process.on("SIGTERM", () => {
  server.close(() => { console.log("✅ Process terminated"); process.exit(0); });
});
process.on("SIGINT", () => {
  server.close(() => { console.log("✅ Process terminated"); process.exit(0); });
});
server.on("error", (error: any) => {
  console.error("❌ Server error:", error);
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use`);
    process.exit(1);
  }
});