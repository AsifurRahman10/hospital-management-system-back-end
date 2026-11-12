FROM node:26-bookworm-slim AS base

WORKDIR /app

RUN apt-get update \
	&& apt-get install -y --no-install-recommends openssl \
	&& rm -rf /var/lib/apt/lists/*

RUN npm install --global pnpm@12.6.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

FROM base AS dependencies

RUN pnpm install --frozen-lockfile

FROM dependencies AS build

COPY tsconfig.json prisma7.config.ts ./
COPY prisma ./prisma
COPY generated ./generated
COPY src ./src

RUN pnpm build

FROM dependencies AS development

ENV NODE_ENV=development

COPY . .

EXPOSE 5000

CMD ["pnpm", "dev"]

FROM base AS production

ENV NODE_ENV=production

COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/src ./src
COPY --from=build /app/generated ./generated
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma7.config.ts ./prisma7.config.ts
COPY package.json ./

EXPOSE 5000

CMD ["sh", "-c", "pnpm exec prisma migrate deploy && pnpm exec tsx src/server.ts"]