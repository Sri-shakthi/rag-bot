const config = require("../config");
const { AppError } = require("../utils/errorHandler");

async function generateChatCompletion(systemPrompt, userPrompt) {
  if (!config.geminiApiKey) {
    throw new AppError("Missing Gemini API key", 500);
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiChatModel}:generateContent?key=${config.geminiApiKey}`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        systemInstruction: {
          role: "system",
          parts: [{ text: systemPrompt }]
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }]
          }
        ],
        generationConfig: {
          temperature: 0.2
        }
      })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new AppError(
        "Failed to generate LLM response",
        mapGeminiStatus(response.status),
        payload?.error || payload
      );
    }

    const reply =
      payload?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("\n").trim() || "";

    return {
      reply,
      usage: {
        total_tokens: payload?.usageMetadata?.totalTokenCount || 0
      }
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to generate LLM response", 502, {
      message: error?.message || "Unknown Gemini chat error"
    });
  }
}

function mapGeminiStatus(status) {
  if (status === 401 || status === 403) return 401;
  if (status === 429) return 429;
  if (status === 408) return 504;
  return 502;
}

module.exports = {
  generateChatCompletion
};
