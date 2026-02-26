require("dotenv").config();

function normalizeOrigin(value) {
  const v = String(value || "").trim();
  if (!v) return null;
  if (v.startsWith("http://") || v.startsWith("https://")) {
    try {
      const url = new URL(v);
      return `${url.protocol}//${url.host}`;
    } catch (_error) {
      return v.replace(/\/+$/, "");
    }
  }
  if (/^\d+$/.test(v)) return `http://localhost:${v}`;
  return `http://${v}`.replace(/\/+$/, "");
}

const parsedOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((item) => normalizeOrigin(item))
  .filter(Boolean);

const corsOrigins = Array.from(
  new Set([
    ...parsedOrigins,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173"
  ])
);

const config = {
  port: Number(process.env.PORT || 3001),
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigins,
  googleClientIds: (process.env.GOOGLE_CLIENT_IDS || process.env.GOOGLE_CLIENT_ID || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean),
  authJwtSecret: process.env.AUTH_JWT_SECRET || "",
  authCookieName: process.env.AUTH_COOKIE_NAME || "rag_auth",
  authCookieMaxAgeMs: Number(
    process.env.AUTH_COOKIE_MAX_AGE_MS || 10 * 24 * 60 * 60 * 1000
  ),
  authCookieSameSite:
    process.env.AUTH_COOKIE_SAME_SITE || (process.env.NODE_ENV === "production" ? "none" : "lax"),
  authCookieSecure:
    process.env.AUTH_COOKIE_SECURE === "true" || process.env.NODE_ENV === "production",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiEmbeddingModel: process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001",
  geminiEmbeddingDimensions: Number(process.env.GEMINI_EMBEDDING_DIMENSIONS || 0),
  geminiChatModel: process.env.GEMINI_CHAT_MODEL || "gemini-2.5-flash",
  pineconeApiKey: process.env.PINECONE_API_KEY || "",
  pineconeIndex: process.env.PINECONE_INDEX || "",
  pineconeNamespace: process.env.PINECONE_NAMESPACE || "legal-cases",
  similarityThreshold: Number(process.env.SIMILARITY_THRESHOLD || 0.45),
  topK: Number(process.env.TOP_K || 5),
  historyPairs: Number(process.env.HISTORY_PAIRS || 5)
};

module.exports = config;
