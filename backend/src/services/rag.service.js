const config = require("../config");
const { generateEmbedding } = require("./embedding.service");
const { queryVectors } = require("./pinecone.service");
const { cosineSimilarity } = require("./similarity.service");
const { generateChatCompletion } = require("./llm.service");
const { findCaseById } = require("../data-access/case.repository");
const { findUploadedDocumentById } = require("../data-access/document.repository");
const {
  getSessionBySessionId,
  upsertSessionMessages
} = require("../data-access/session.repository");
const logger = require("../utils/logger");
const { AppError } = require("../utils/errorHandler");

const FALLBACK_MESSAGE =
  "The uploaded case does not contain sufficient information to answer this question.";

const SYSTEM_PROMPT = `You are a legal document assistant.
You must answer only using the selected case document.
If the answer is not explicitly supported by the document,
say you do not know.
Do not provide general legal advice or speculation.`;

async function runLegalRagChat({ sessionId, caseId, documentId, message, debug = false }) {
  let sourceMode = "case";
  let filter = null;
  let fallbackMessage = FALLBACK_MESSAGE;
  let systemPrompt = SYSTEM_PROMPT;

  if (documentId) {
    const doc = await findUploadedDocumentById(documentId);
    if (!doc) {
      throw new AppError("Invalid documentId", 400);
    }
    sourceMode = "document";
    filter = {
      documentId: { $eq: documentId }
    };
    fallbackMessage =
      "The uploaded case does not contain sufficient information to answer this question.";
    systemPrompt = `You are a document assistant.
You must answer only using the uploaded document context.
If the answer is not explicitly supported by the document,
say you do not know.
Do not provide speculation.`;
  } else {
    const selectedCase = await findCaseById(caseId);
    if (!selectedCase) {
      throw new AppError("Invalid caseId", 400);
    }
    filter = {
      caseId: { $eq: caseId }
    };
  }

  const session = await getSessionBySessionId(sessionId);
  const previousMessages = Array.isArray(session?.messages) ? session.messages : [];
  const fixedCaseHistory =
    session && caseId && session.caseId !== caseId ? [] : previousMessages;

  const queryEmbedding = await generateEmbedding(message);
  let pineconeResponse;
  try {
    pineconeResponse = await queryVectors(queryEmbedding, filter, config.topK);
  } catch (error) {
    throw new AppError("Pinecone query failed", 502, {
      message: error.message
    });
  }

  const scored = (pineconeResponse.matches || [])
    .map((match) => {
      const values = Array.isArray(match.values) ? match.values : [];
      const similarityScore = typeof match.score === "number"
        ? match.score
        : cosineSimilarity(queryEmbedding, values);
      return {
        id: match.id,
        content: String(match.metadata?.content || ""),
        similarityScore,
        metadata: match.metadata || {}
      };
    })
    .sort((a, b) => b.similarityScore - a.similarityScore);

  const top3 = scored.slice(0, 3);
  top3.forEach((chunk, index) => {
    logger.info("retrieved_chunk_similarity", {
      rank: index + 1,
      caseId: caseId || null,
      documentId: documentId || null,
      similarityScore: Number(chunk.similarityScore.toFixed(6))
    });
  });
  const top1 = top3[0];
  const aboveThreshold = top1 && top1.similarityScore >= config.similarityThreshold;
  const confidenceScore = calculateConfidence(top3);

  const resolvedCaseId = caseId || session?.caseId;
  if (!resolvedCaseId) {
    throw new AppError("Invalid caseId", 400);
  }

  if (!aboveThreshold) {
    await storeSessionExchange(
      sessionId,
      resolvedCaseId,
      fixedCaseHistory,
      message,
      fallbackMessage
    );
    return debug
      ? {
          reply: fallbackMessage,
          confidenceScore,
          retrievedChunks: top3,
          tokensUsed: 0
        }
      : {
          reply: fallbackMessage,
          confidenceScore
        };
  }

  const historyPairs = toHistoryPairs(fixedCaseHistory, config.historyPairs);
  const prompt = buildPrompt(top3, historyPairs, message);
  const llmResult = await generateChatCompletion(systemPrompt, prompt);

  logger.info("legal_rag_token_usage", {
    sessionId,
    caseId: caseId || null,
    documentId: documentId || null,
    sourceMode,
    total_tokens: llmResult.usage.total_tokens || 0
  });

  await storeSessionExchange(
    sessionId,
    resolvedCaseId,
    fixedCaseHistory,
    message,
    llmResult.reply
  );

  return debug
    ? {
        reply: llmResult.reply,
        confidenceScore,
        retrievedChunks: top3,
        tokensUsed: llmResult.usage.total_tokens || 0
      }
    : {
        reply: llmResult.reply,
        confidenceScore
      };
}

function buildPrompt(chunks, historyPairs, userMessage) {
  const contextText = chunks
    .map((chunk, idx) => `${idx + 1}. ${chunk.content}`)
    .join("\n");

  const historyText =
    historyPairs.length === 0
      ? "No prior conversation."
      : historyPairs
          .map(
            (pair, idx) =>
              `${idx + 1}. User: ${pair.user}\nAssistant: ${pair.assistant}`
          )
          .join("\n");

  return [
    "Context:",
    contextText,
    "",
    "Conversation History:",
    historyText,
    "",
    "User Question:",
    userMessage
  ].join("\n");
}

function toHistoryPairs(messages, maxPairs) {
  const pairs = [];
  for (let i = 0; i < messages.length; i += 2) {
    const userMessage = messages[i];
    const assistantMessage = messages[i + 1];
    if (userMessage?.role === "user" && assistantMessage?.role === "assistant") {
      pairs.push({
        user: userMessage.content,
        assistant: assistantMessage.content
      });
    }
  }
  return pairs.slice(-maxPairs);
}

function trimToLastPairs(messages, maxPairs) {
  const maxMessages = maxPairs * 2;
  return messages.slice(-maxMessages);
}

function calculateConfidence(chunks) {
  if (!chunks.length) return 0;
  const sum = chunks.reduce((acc, item) => acc + item.similarityScore, 0);
  return Number((sum / chunks.length).toFixed(4));
}

async function storeSessionExchange(sessionId, caseId, prevMessages, userMessage, assistantReply) {
  const nextMessages = trimToLastPairs(
    [
      ...prevMessages,
      { role: "user", content: userMessage },
      { role: "assistant", content: assistantReply }
    ],
    5
  );
  await upsertSessionMessages(sessionId, caseId, nextMessages);
}

module.exports = {
  runLegalRagChat
};
