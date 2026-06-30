FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:web

FROM nginx:stable-alpine
ARG DEV_BANNER=
COPY --from=build /app/dist /usr/share/nginx/html
RUN if [ -n "$DEV_BANNER" ]; then \
      sed -i 's|<title>|<title>[DEV] |' /usr/share/nginx/html/index.html; \
    fi
