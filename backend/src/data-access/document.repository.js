const prisma = require("../prisma/client");
const { AppError } = require("../utils/errorHandler");

async function createUploadedDocument({ id, sessionId, fileName }) {
  if (!prisma.uploadedDocument) {
    throw new AppError(
      "UploadedDocument model is not initialized. Run prisma generate and restart.",
      500
    );
  }
  try {
    return await prisma.uploadedDocument.create({
      data: { id, sessionId, fileName }
    });
  } catch (error) {
    if (error?.code === "P2021") {
      throw new AppError(
        "UploadedDocument table not found. Please run Prisma migrations.",
        500
      );
    }
    throw error;
  }
}

async function listUploadedDocumentsBySession(sessionId) {
  if (!prisma.uploadedDocument) {
    return [];
  }
  try {
    return await prisma.uploadedDocument.findMany({
      where: { sessionId },
      orderBy: { createdAt: "desc" }
    });
  } catch (error) {
    if (error?.code === "P2021") {
      return [];
    }
    throw error;
  }
}

async function findUploadedDocumentById(id) {
  return prisma.uploadedDocument.findUnique({
    where: { id }
  });
}

module.exports = {
  createUploadedDocument,
  listUploadedDocumentsBySession,
  findUploadedDocumentById
};
