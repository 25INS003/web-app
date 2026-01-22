# syntax=docker/dockerfile:1.4
ARG NODE_ENV=production
FROM node:20-alpine AS base

# --- 1. BUILD STAGE ---
WORKDIR /app

# Copy necessary package files
COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm \
  npm ci --silent

COPY . .
COPY .env ./

# Next.js requires this variable at BUILD time to bake it into client bundles
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Run the Next.js build command
RUN npm run build

# --- 2. RUN STAGE (Production) ---
FROM node:20-alpine AS run
WORKDIR /app

ENV NODE_ENV=${NODE_ENV}
# Set the port explicitly for the Next.js runtime
ENV PORT=3000

# Copy necessary files from the build stage for the runtime environment
# We only need the files required for execution, not the entire source code.
COPY --from=base /app/package*.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public

# Note: next.config.mjs is often not strictly needed at runtime if it was processed 
# during the build, but copying it is safer if it contains runtime logic.
COPY --from=base /app/next.config.mjs ./

EXPOSE 3000

# Use the 'start' command which serves the optimized production build
CMD ["npm", "run", "start"]