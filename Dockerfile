FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --include=dev --ignore-scripts
COPY . .
RUN npm run build

FROM node:20-alpine AS server-deps
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN apk add --no-cache dumb-init && adduser -D -u 1001 medcore
COPY --from=server-deps /app/server/node_modules ./server/node_modules
COPY --chown=medcore:medcore server ./server
COPY --from=frontend-build --chown=medcore:medcore /app/dist ./dist
RUN mkdir -p /app/server/data && chown -R medcore:medcore /app/server/data
USER medcore
EXPOSE 3001
ENV PORT=3001
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "--import", "./server/node_modules/tsx/dist/loader.mjs", "./server/src/index.ts"]
