const { AppError } = require("../utils/errorHandler");
const { chunkText } = require("../services/chunking.service");
const { generateEmbedding } = require("../services/embedding.service");
const { upsertVectors } = require("../services/pinecone.service");
const {
  createUploadedDocument,
  listUploadedDocumentsBySession
} = require("../data-access/document.repository");
const { getSessionBySessionId } = require("../data-access/session.repository");
const logger = require("../utils/logger");

async function uploadDocument(req) {
  const { sessionId, caseId } = req.body || {};
  if (!sessionId || !caseId) {
    throw new AppError("sessionId and caseId are required", 400);
  }
  if (!req.file) {
    throw new AppError("file is required", 400);
  }

  const session = await getSessionBySessionId(sessionId);
  if (!session) {
    throw new AppError("Missing session", 404);
  }

  const text = extractText(req.file);
  if (!text || text.trim().length < 20) {
    throw new AppError("Unable to extract usable text from file", 400);
  }

  const documentId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  await createUploadedDocument({
    id: documentId,
    sessionId,
    fileName: req.file.originalname
  });

  const chunks = chunkText(text, 400, 50);
  const vectors = [];
  for (let i = 0; i < chunks.length; i += 1) {
    const content = chunks[i];
    const embedding = await generateEmbedding(content);
    vectors.push({
      id: `${documentId}-chunk-${i}`,
      values: embedding,
      metadata: {
        sourceType: "uploaded",
        documentId,
        sessionId,
        caseId,
        fileName: req.file.originalname,
        chunkIndex: i,
        content
      }
    });
  }
  await upsertVectors(vectors);

  logger.info("uploaded_document_indexed", {
    documentId,
    sessionId,
    chunks: vectors.length
  });

  return {
    documentId,
    fileName: req.file.originalname,
    chunks: vectors.length
  };
}

async function getDocuments(req) {
  const sessionId = String(req.query.sessionId || "").trim();
  if (!sessionId) {
    throw new AppError("sessionId is required", 400);
  }
  const documents = await listUploadedDocumentsBySession(sessionId);
  return { documents };
}

function extractText(file) {
  const mime = String(file.mimetype || "");
  if (
    mime.includes("text/plain") ||
    mime.includes("text/markdown") ||
    mime.includes("application/json") ||
    mime.includes("text/csv")
  ) {
    return file.buffer.toString("utf-8");
  }
  // Best-effort decode for unknown text-like documents.
  return file.buffer.toString("utf-8");
}

module.exports = {
  uploadDocument,
  getDocuments
};
