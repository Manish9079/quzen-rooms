# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# Vite env vars are baked in at build time, not read at container runtime —
# pass the real API/socket URLs as build args in production.
ARG VITE_API_URL=http://localhost:4000/api
ARG VITE_SOCKET_URL=http://localhost:4000
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Production stage ----
FROM nginx:1.27-alpine AS production
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
