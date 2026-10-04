FROM node:20-slim

# Install system dependencies including OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy root configuration and backend package definitions
COPY backend/package*.json ./backend/
COPY prisma ./prisma/

WORKDIR /app/backend
RUN npm install

# Symlink node_modules to /app/node_modules and set NODE_PATH for root-level scripts
RUN ln -s /app/backend/node_modules /app/node_modules
ENV NODE_PATH=/app/backend/node_modules

# Generate Prisma Client
RUN npx prisma generate --schema=../prisma/schema.prisma

# Copy backend source
COPY backend/ ./

# Create storage structure inside container
RUN mkdir -p /app/storage/documents /app/storage/uploads

# Copy initial storage documents and lab flag into container
COPY storage/ /app/storage/

ENV PORT=5000
ENV NODE_ENV=production
ENV STORAGE_DOCUMENTS_DIR=/app/storage/documents
ENV STORAGE_UPLOADS_DIR=/app/storage/uploads

EXPOSE 5000

# Compile typescript
RUN npm run build

# Start script: wait for db, push schema, seed, then start
CMD ["sh", "-c", "npx prisma db push --schema=../prisma/schema.prisma --accept-data-loss && npx tsx ../prisma/seed.ts && node dist/server.js"]
