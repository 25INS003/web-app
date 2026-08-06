# syntax=docker/dockerfile:1.7
#
# Production image for the Nedyway storefront + panels. Built for linux/amd64
# (Hostinger VPS) and linux/arm64 (Raspberry Pi 5) — see
# .github/workflows/publish.yml.
#
# Both stages run *on the target platform* under buildx. Next resolves a
# per-architecture SWC binary (@next/swc-linux-x64-gnu vs -arm64-gnu) at install
# time, so neither node_modules nor .next may be reused across architectures.
#
# The runtime is the standalone bundle (next.config.mjs sets output:
# 'standalone'), which carries only the modules the build actually reaches:
# an 89 MB /app payload instead of the 753 MB node_modules tree the previous
# image copied wholesale. Final image 465 MB, of which 331 MB is the node:24-slim
# base. On a Pi that is the difference between a fast pull and a painful one.

# Base is node 24 (Active LTS): node 20 went end-of-life in April 2026, and the
# lockfile here was written by npm 11, which the npm 10.9 bundled with node
# 20/22 rejects ("Missing: … from lock file"). node 24 ships npm 11.
# --------------------------------------------------------------------- builder
FROM node:24-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./

# --legacy-peer-deps matches how this tree resolves today; `ci` still pins every
# version to the lockfile.
RUN npm ci --legacy-peer-deps

COPY . .

# Deliberately NOT taking the API origin as a build arg. NEXT_PUBLIC_* is inlined
# into the client bundle at build time, so baking a hostname would make the image
# environment-specific — a separate build per environment. The app defaults to
# the relative "/api/v1" (src/lib/api/client.ts), same-origin behind nginx, which
# keeps one image valid everywhere. The server-side origin (API_INTERNAL_URL) is
# read at runtime and belongs in the Deployment env, not here.
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --------------------------------------------------------------------- runtime
FROM node:24-slim AS runtime
WORKDIR /app

# HOSTNAME: the standalone server binds 127.0.0.1 by default, which would be
# unreachable from outside the container and fail every readiness probe.
ENV NODE_ENV=production \
    PORT=3000 \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0

# The standalone output already contains its own minimal node_modules and a
# server.js entrypoint; static/ and public/ are the two things it does not embed.
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# standalone emits its own server.js — `next start` is not used (and is not even
# installed in this image).
CMD ["node", "server.js"]
