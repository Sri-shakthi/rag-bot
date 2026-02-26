FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3001

CMD ["sh", "-c", "npx prisma generate --schema=src/prisma/schema.prisma && npx prisma migrate deploy --schema=src/prisma/schema.prisma && node src/server.js"]
