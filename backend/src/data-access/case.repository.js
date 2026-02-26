const prisma = require("../prisma/client");

async function upsertCases(cases) {
  return prisma.$transaction(
    cases.map((item) =>
      prisma.case.upsert({
        where: { id: item.id },
        create: item,
        update: {
          name: item.name,
          jurisdiction: item.jurisdiction,
          year: item.year,
          description: item.description
        }
      })
    )
  );
}

async function listCases() {
  return prisma.case.findMany({
    orderBy: { year: "asc" }
  });
}

async function findCaseById(caseId) {
  return prisma.case.findUnique({
    where: { id: caseId }
  });
}

module.exports = {
  upsertCases,
  listCases,
  findCaseById
};
