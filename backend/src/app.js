const express = require("express");
const config = require("./config");
const authRoutes = require("./routes/auth.routes");
const aiRoutes = require("./routes/ai.routes");
const caseRoutes = require("./routes/case.routes");
const documentRoutes = require("./routes/document.routes");
const chatRoutes = require("./routes/chat.routes");
const {
  notFoundHandler,
  errorHandler
} = require("./utils/errorHandler");

const app = express();

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = config.corsOrigins;
  const isAllowed = !origin || allowedOrigins.includes(origin);

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
app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/cases", caseRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api", chatRoutes);
app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
