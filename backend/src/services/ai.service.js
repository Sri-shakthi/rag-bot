const { generateChatCompletion } = require("./llm.service");
const logger = require("../utils/logger");

const SYSTEM_PROMPT = `You are a helpful assistant.
Always format answers in clean Markdown:
- For short answers (1-2 sentences), do NOT use bullet points; respond as a plain paragraph.
- For longer answers with multiple points, start with a short heading using ## and then use bullet points.
- Use **bold** for important terms.
- Keep it concise and readable.
Do not output raw JSON unless explicitly asked.`;

async function runAiMessage({ sessionId, message, history }) {
  const historyText = Array.isArray(history) && history.length
    ? history
        .slice(-10)
        .map((h, i) => `${i + 1}. ${h.role}: ${h.content}`)
        .join("\n")
    : "No prior conversation.";

  const prompt = [
    "Conversation History:",
    historyText,
    "",
    "User Message:",
    message
  ].join("\n");

  const llmResult = await generateChatCompletion(SYSTEM_PROMPT, prompt);

  logger.info("ai_message_tokens", {
    sessionId,
    total_tokens: llmResult.usage.total_tokens || 0
  });

  return {
    reply: llmResult.reply,
    tokensUsed: llmResult.usage.total_tokens || 0
  };
}

module.exports = {
  runAiMessage
};
