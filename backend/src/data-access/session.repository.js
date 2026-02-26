const prisma = require("../prisma/client");

async function getSessionBySessionId(sessionId) {
  return prisma.session.findUnique({
    where: { sessionId }
  });
}

async function upsertSessionMessages(sessionId, caseId, messages) {
  return prisma.session.upsert({
    where: { sessionId },
    create: { sessionId, caseId, messages },
    update: { caseId, messages }
  });
}

async function createSession(sessionId, caseId) {
  return prisma.session.create({
    data: {
      sessionId,
      caseId,
      messages: []
    }
  });
}

async function listSessionsByCase(caseId) {
  return prisma.session.findMany({
    where: { caseId },
    orderBy: { updatedAt: "desc" }
  });
}

async function listAllSessions() {
  return prisma.session.findMany({
    orderBy: { updatedAt: "desc" }
  });
}

module.exports = {
  getSessionBySessionId,
  upsertSessionMessages,
  createSession,
  listSessionsByCase,
  listAllSessions
};
