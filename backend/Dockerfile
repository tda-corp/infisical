# Build stage
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci --only-production

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

ENV npm_config_cache /home/node/.npm

COPY package*.json ./
RUN npm ci --only-production && npm cache clean --force

COPY --from=build /app .

RUN apk add --no-cache bash curl && curl -1sLf \
  'https://dl.cloudsmith.io/public/infisical/infisical-cli/setup.alpine.sh' | bash \
  && apk add infisical=0.8.1 && apk add --no-cache git

ENV HOST=0.0.0.0

EXPOSE 4000

CMD ["npm", "start"]
