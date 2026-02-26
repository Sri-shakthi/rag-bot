function dotProduct(a, b) {
  let sum = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i += 1) {
    sum += a[i] * b[i];
  }
  return sum;
}

function magnitude(vector) {
  return Math.sqrt(dotProduct(vector, vector));
}

function normalizeVector(vector) {
  const mag = magnitude(vector);
  if (mag === 0) return vector.map(() => 0);
  return vector.map((v) => v / mag);
}

function cosineSimilarity(a, b) {
  const normalizedA = normalizeVector(a);
  const normalizedB = normalizeVector(b);
  return dotProduct(normalizedA, normalizedB);
}

module.exports = {
  dotProduct,
  magnitude,
  normalizeVector,
  cosineSimilarity
};
