const app = require("./app");
const config = require("./config");
const logger = require("./utils/logger");
const fs = require("fs/promises");
const path = require("path");
const prisma = require("./prisma/client");
const { upsertCases } = require("./data-access/case.repository");
const { chunkText } = require("./services/chunking.service");
const { generateEmbedding } = require("./services/embedding.service");
const { upsertVectors } = require("./services/pinecone.service");

const PRELOADED_CASES = [
  {
    id: "case1",
    fileName: "case1.txt",
    name: "State v. Raman (Contract Fraud Appeal)",
    jurisdiction: "India Supreme Court",
    year: 2019,
    description: "Appeal concerning misrepresentation and enforceability in a public tender contract."
  },
  {
    id: "case2",
    fileName: "case2.txt",
    name: "Kumar Industries v. Metro Authority",
    jurisdiction: "Delhi High Court",
    year: 2021,
    description: "Dispute over liquidated damages and delay attribution in infrastructure procurement."
  },
  {
    id: "case3",
    fileName: "case3.txt",
    name: "People v. Aditi Sharma",
    jurisdiction: "Bombay High Court",
    year: 2018,
    description: "Criminal appeal discussing evidentiary chain, witness reliability, and burden of proof."
  },
  {
    id: "case4",
    fileName: "case4.txt",
    name: "Green Earth Foundation v. Union Territory",
    jurisdiction: "National Green Tribunal",
    year: 2020,
    description: "Environmental compliance litigation over unlawful discharge and remedial directions."
  },
  {
    id: "case5",
    fileName: "case5.txt",
    name: "Nair v. Coastal Bank",
    jurisdiction: "Kerala High Court",
    year: 2022,
    description: "Consumer and banking law dispute on unauthorized digital transactions and liability."
  }
];

async function bootstrapPreloadedCases() {
  await upsertCases(
    PRELOADED_CASES.map((item) => ({
      id: item.id,
      name: item.name,
      jurisdiction: item.jurisdiction,
      year: item.year,
      description: item.description
    }))
  );

  for (const legalCase of PRELOADED_CASES) {
    const filePath = path.join(
      __dirname,
      "data",
      "preloadedCases",
      legalCase.fileName
    );
    const text = await fs.readFile(filePath, "utf-8");
    const chunks = chunkText(text, 400, 50);

    const vectors = [];
    for (let i = 0; i < chunks.length; i += 1) {
      const content = chunks[i];
      const embedding = await generateEmbedding(content);
      vectors.push({
        id: `${legalCase.id}-chunk-${i}`,
        values: embedding,
        metadata: {
          caseId: legalCase.id,
          caseName: legalCase.name,
          jurisdiction: legalCase.jurisdiction,
          year: legalCase.year,
          chunkIndex: i,
          content
        }
      });
    }

    await upsertVectors(vectors);
    logger.info("case_indexed", {
      caseId: legalCase.id,
      chunks: vectors.length
    });
  }
}

async function startServer() {
  try {
    await bootstrapPreloadedCases();
    app.listen(config.port, () => {
      logger.info("server_started", {
        port: config.port,
        env: config.nodeEnv
      });
    });
  } catch (error) {
    logger.error("startup_failed", {
      message: error.message,
      details: error.details || null,
      stack: error.stack
    });
    await prisma.$disconnect();
    process.exit(1);
  }
}

startServer();
