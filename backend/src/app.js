const express = require("express");
const cookieParser = require("cookie-parser");
const config = require("./config");
const authRoutes = require("./routes/auth.routes");
const aiRoutes = require("./routes/ai.routes");
const caseRoutes = require("./routes/case.routes");
const documentRoutes = require("./routes/document.routes");
const chatRoutes = require("./routes/chat.routes");
const { requireAuth } = require("./middlewares/auth.middleware");
const {
  notFoundHandler,
  errorHandler
} = require("./utils/errorHandler");

const app = express();

function isAllowedOrigin(origin, allowedOrigins) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;

  let originUrl;
  try {
    originUrl = new URL(origin);
  } catch (_error) {
    return false;
  }

  return allowedOrigins.some((allowed) => {
    if (!allowed.includes("*")) return false;
    let allowedUrl;
    try {
      allowedUrl = new URL(allowed);
    } catch (_error) {
      return false;
    }

    if (allowedUrl.protocol !== originUrl.protocol) return false;
    if (!allowedUrl.hostname.startsWith("*.")) return false;

    const suffix = allowedUrl.hostname.slice(2);
    return (
      originUrl.hostname === suffix || originUrl.hostname.endsWith(`.${suffix}`)
    );
  });
}

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = config.corsOrigins;
  const isAllowed = isAllowedOrigin(origin, allowedOrigins);

  if (isAllowed && origin) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Vary", "Origin");
  }
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(isAllowed ? 204 : 403);
  }

  if (!isAllowed) {
    return res.status(403).json({
      error: true,
      message: "CORS origin not allowed"
    });
  }

  return next();
});

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/ai", requireAuth, aiRoutes);
app.use("/api/cases", requireAuth, caseRoutes);
app.use("/api/documents", requireAuth, documentRoutes);
app.use("/api", requireAuth, chatRoutes);
app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
