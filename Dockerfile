# syntax=docker/dockerfile:1.4
ARG NODE_ENV=production
FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm \
  npm ci --production --silent

COPY . .

RUN npm run build

FROM node:20-alpine AS run
WORKDIR /app

ENV NODE_ENV=${NODE_ENV}

COPY --from=base /app/package*.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/next.config.mjs ./next.config.mjs

EXPOSE 3000

CMD ["npm", "run", "start"]
