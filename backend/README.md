# Legal RAG Backend

Production-grade Legal RAG backend using Node.js, Express, Prisma, MySQL, Pinecone, and Gemini.

## Architecture

Flow is strictly layered:

`Route -> Validation -> Controller -> Service -> Data Access -> Response`

## API

### `GET /api/cases`
Returns all preloaded legal cases.

### `GET /api/cases/:caseId`
Returns one case by id.

### `POST /api/chat?debug=true|false`
Body:

```json
{
  "sessionId": "session-123",
  "caseId": "case1",
  "message": "What did the court hold on waiver?"
}
```

`debug=false` response:

```json
{
  "reply": "...",
  "confidenceScore": 0.8123
}
```

`debug=true` response:

```json
{
  "reply": "...",
  "confidenceScore": 0.8123,
  "retrievedChunks": [
    {
      "content": "...",
      "similarityScore": 0.84,
      "metadata": {
        "caseId": "case1",
        "caseName": "...",
        "jurisdiction": "...",
        "year": 2019,
        "chunkIndex": 0
      }
    }
  ],
  "tokensUsed": 321
}
```

## Startup Preload

On server startup:

1. Upserts 5 predefined cases into MySQL.
2. Reads `src/data/preloadedCases/case1.txt` ... `case5.txt`.
3. Chunks each case (400 tokens target, 50 overlap).
4. Generates embeddings with Gemini.
5. Upserts vectors to Pinecone with case metadata.

## Environment

Copy `.env.example` to `.env` and set:

- `DATABASE_URL`
- `GEMINI_API_KEY`
- `PINECONE_API_KEY`
- `PINECONE_INDEX`

## Run

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

## Docker

```bash
docker compose up --build
```
