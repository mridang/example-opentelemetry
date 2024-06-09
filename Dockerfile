FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx nest build

FROM unit:1.32.1-node20

WORKDIR /app

COPY --from=builder /app/dist ./
COPY --from=builder /app/package*.json ./

RUN npm install --production
RUN npm install --global --unsafe-perm unit-http
RUN npm link unit-http

COPY unit.json /docker-entrypoint.d/unit.json

ENV NODE_ENV=production
