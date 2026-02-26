const config = require("../config");
const { AppError } = require("../utils/errorHandler");

async function generateEmbedding(input) {
  if (!config.geminiApiKey) {
    throw new AppError("Missing Gemini API key", 500);
  }

  try {
    const primaryModel = normalizeModelName(config.geminiEmbeddingModel);
    let result = await requestEmbedding(primaryModel, input);

    if (!result.ok && result.payload?.error?.status === "NOT_FOUND") {
      const fallbackModel = await chooseEmbeddingFallbackModel();
      if (fallbackModel && fallbackModel !== primaryModel) {
        result = await requestEmbedding(fallbackModel, input);
      }
    }

    if (!result.ok) {
      throw new AppError(
        "Failed to generate embeddings",
        mapGeminiStatus(result.status),
        result.payload?.error || result.payload
      );
    }

    const embedding = result.payload?.embedding?.values;
    if (!Array.isArray(embedding) || embedding.length === 0) {
      throw new AppError("Failed to generate embeddings", 502, {
        message: "Gemini embedding response missing values"
      });
    }

    return embedding;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      "Failed to generate embeddings",
      502,
      {
        message: error?.message || "Unknown Gemini embedding error"
      }
    );
  }
}

function mapGeminiStatus(status) {
  if (status === 401 || status === 403) return 401;
  if (status === 429) return 429;
  if (status === 408) return 504;
  return 502;
}

async function requestEmbedding(modelName, input) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:embedContent?key=${config.geminiApiKey}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      content: {
        parts: [{ text: input }]
      },
      ...(config.geminiEmbeddingDimensions > 0
        ? { outputDimensionality: config.geminiEmbeddingDimensions }
        : {})
    })
  });

  const payload = await response.json().catch(() => ({}));
  return {
    ok: response.ok,
    status: response.status,
    payload
  };
}

async function chooseEmbeddingFallbackModel() {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${config.geminiApiKey}`;
  const response = await fetch(endpoint, { method: "GET" });
  if (!response.ok) return null;

  const payload = await response.json().catch(() => ({}));
  const models = Array.isArray(payload?.models) ? payload.models : [];
  const supported = models
    .filter((m) => Array.isArray(m.supportedGenerationMethods))
    .filter((m) => m.supportedGenerationMethods.includes("embedContent"))
    .map((m) => normalizeModelName(m.name))
    .filter(Boolean);

  const preferredOrder = ["gemini-embedding-001", "text-embedding-004"];
  for (const preferred of preferredOrder) {
    if (supported.includes(preferred)) return preferred;
  }

  return supported[0] || null;
}

function normalizeModelName(name) {
  if (!name) return "";
  return String(name).replace(/^models\//, "").trim();
}

module.exports = {
  generateEmbedding
};
