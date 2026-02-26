const { Pinecone } = require("@pinecone-database/pinecone");
const config = require("../config");
const { AppError } = require("../utils/errorHandler");

let indexRef = null;

function getIndex() {
  if (indexRef) return indexRef;

  if (!config.pineconeApiKey || !config.pineconeIndex) {
    throw new AppError("Pinecone configuration is missing", 500);
  }

  const pinecone = new Pinecone({
    apiKey: config.pineconeApiKey
  });
  indexRef = pinecone.index(config.pineconeIndex);
  return indexRef;
}

async function upsertVectors(vectors) {
  if (!vectors.length) return;
  const index = getIndex().namespace(config.pineconeNamespace);
  await index.upsert(vectors);
}

async function queryVectors(embedding, filter, topK = 5) {
  const index = getIndex().namespace(config.pineconeNamespace);
  return index.query({
    vector: embedding,
    topK,
    includeMetadata: true,
    includeValues: true,
    filter
  });
}

module.exports = {
  upsertVectors,
  queryVectors
};
