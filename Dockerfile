# 軽量Linux (Alpine) を使用
FROM node:20-alpine AS base

# ★★★ 追加: Prismaに必要なライブラリ(OpenSSL)をインストール ★★★
RUN apk add --no-cache libc6-compat openssl

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# 柔軟にインストール
RUN npm install

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ビルドを通すためのダミー設定
ARG DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ARG DIRECT_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV DATABASE_URL=${DATABASE_URL}
ENV DIRECT_URL=${DIRECT_URL}

# Prismaクライアント生成
RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED 1

# ビルド実行
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 8080
ENV PORT 8080
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]