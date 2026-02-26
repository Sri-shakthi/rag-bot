const { listCases, findCaseById } = require("../data-access/case.repository");
const { AppError } = require("../utils/errorHandler");
const fs = require("fs/promises");
const path = require("path");

async function getCases() {
  const cases = await listCases();
  return {
    cases
  };
}

async function getCaseById(caseId) {
  const legalCase = await findCaseById(caseId);
  if (!legalCase) {
    throw new AppError("Invalid caseId", 400);
  }
  const filePath = path.join(__dirname, "..", "data", "preloadedCases", `${caseId}.txt`);
  const content = await fs.readFile(filePath, "utf-8");
  return {
    case: {
      ...legalCase,
      content
    }
  };
}

module.exports = {
  getCases,
  getCaseById
};
