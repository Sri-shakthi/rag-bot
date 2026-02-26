const { runLegalRagChat } = require("../services/rag.service");
const { AppError } = require("../utils/errorHandler");
const {
  createSession,
  listSessionsByCase,
  listAllSessions,
  getSessionBySessionId
} = require("../data-access/session.repository");
const { findCaseById } = require("../data-access/case.repository");

async function postChat(req) {
  const payload = req.validatedBody;
  const debug = String(req.query.debug || "false").toLowerCase() === "true";
  return runLegalRagChat({
    ...payload,
    debug
  });
}

async function createChatSession(req) {
  const { sessionId, caseId } = req.body || {};
  if (!sessionId || !caseId) {
    throw new AppError("sessionId and caseId are required", 400);
  }

  const legalCase = await findCaseById(caseId);
  if (!legalCase) {
    throw new AppError("Invalid caseId", 400);
  }

  const existing = await getSessionBySessionId(sessionId);
  if (existing) return { session: existing };

  const created = await createSession(sessionId, caseId);
  return { session: created };
}

async function getChatSessions(req) {
  const caseId = String(req.query.caseId || "").trim();
  if (!caseId) {
    const sessions = await listAllSessions();
    return { sessions };
  }
  const legalCase = await findCaseById(caseId);
  if (!legalCase) {
    throw new AppError("Invalid caseId", 400);
  }
  const sessions = await listSessionsByCase(caseId);
  return { sessions };
}

async function getChatSession(req) {
  const sessionId = req.params.sessionId;
  const session = await getSessionBySessionId(sessionId);
  if (!session) {
    throw new AppError("Missing session", 404);
  }
  return { session };
}

module.exports = {
  postChat,
  createChatSession,
  getChatSessions,
  getChatSession
};
