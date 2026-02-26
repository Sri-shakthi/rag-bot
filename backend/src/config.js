require("dotenv").config();

function normalizeOrigin(value) {
  const v = String(value || "").trim();
  if (!v) return null;
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  if (/^\d+$/.test(v)) return `http://localhost:${v}`;
  return `http://${v}`;
}

const parsedOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((item) => normalizeOrigin(item))
  .filter(Boolean);

const corsOrigins = Array.from(
  new Set([
    ...parsedOrigins,
    "http://localhost:3000",
    "http://127.0.0.1:3000"
  ])
);

const config = {
  port: Number(process.env.PORT || 3001),
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigins,
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
