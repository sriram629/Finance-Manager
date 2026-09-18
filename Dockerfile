FROM node:22-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
ENV VITE_API_URL=/api
RUN npm run build

FROM node:22-alpine
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --chown=node:node server/ ./
COPY --from=client-build /app/client/dist /app/client/dist
RUN mkdir -p /app/server/uploads && chown node:node /app/server/uploads
ENV NODE_ENV=production SERVE_CLIENT=true PORT=5050
USER node
EXPOSE 5050
CMD ["node", "index.js"]
