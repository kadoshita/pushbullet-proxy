FROM node:lts-slim as builder

WORKDIR /usr/local/src
COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm ci
COPY tsconfig.json tsconfig.json
COPY index.ts index.ts
RUN npm run build

FROM node:lts-slim as npm

WORKDIR /usr/local/src

COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm ci --production

FROM gcr.io/distroless/nodejs:16

LABEL maintainer="sublimer@sublimer.me"

WORKDIR /usr/local/app
COPY --from=builder /usr/local/src/dist ./dist
COPY --from=npm /usr/local/src/node_modules ./node_modules

ENV NODE_ENV=production
EXPOSE 3000
CMD [ "dist/index.js" ]