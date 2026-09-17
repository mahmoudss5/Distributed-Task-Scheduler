
# ============ Stage 1: Builder ============
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build


# ============ Stage 2: Production ============
FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

# Mount this path in production so generated reports survive container
# replacement.  The application can override it with REPORTS_DIR.
RUN mkdir -p /app/reports
VOLUME ["/app/reports"]
EXPOSE 3000

CMD ["node", "dist/main.js"]
