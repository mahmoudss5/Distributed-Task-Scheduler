
# ============ Stage 1: Builder ============
FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./

RUN PUPPETEER_SKIP_DOWNLOAD=true npm ci

COPY . .

RUN npm run build


# ============ Stage 2: Production ============
FROM node:22-bookworm-slim AS production

WORKDIR /app

COPY package*.json ./

# Puppeteer downloads a Chrome for Testing binary during npm install. Chrome
# needs these shared libraries at runtime; node:*-slim does not include them.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
      ca-certificates \
      fonts-liberation \
      libasound2 \
      libatk-bridge2.0-0 \
      libatk1.0-0 \
      libc6 \
      libcairo2 \
      libcups2 \
      libdbus-1-3 \
      libexpat1 \
      libfontconfig1 \
      libgbm1 \
      libglib2.0-0 \
      libgtk-3-0 \
      libnspr4 \
      libnss3 \
      libpango-1.0-0 \
      libpangocairo-1.0-0 \
      libstdc++6 \
      libx11-6 \
      libx11-xcb1 \
      libxcb1 \
      libxcomposite1 \
      libxdamage1 \
      libxext6 \
      libxfixes3 \
      libxrandr2 \
      libxshmfence1 \
      libxss1 \
      libxtst6 \
      unzip \
      wget \
      xdg-utils \
    && rm -rf /var/lib/apt/lists/*

RUN PUPPETEER_SKIP_DOWNLOAD=true npm ci --omit=dev \
    && npx puppeteer browsers install chrome

COPY --from=builder /app/dist ./dist

# Mount this path in production so generated reports survive container
# replacement.  The application can override it with REPORTS_DIR.
RUN mkdir -p /app/reports
VOLUME ["/app/reports"]
EXPOSE 3000

CMD ["node", "dist/main.js"]
