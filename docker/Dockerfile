# Backend
FROM node:20-alpine AS backend-base
WORKDIR /app
RUN apk add --no-cache openssl
RUN npm install -g tsx
COPY apps/backend/package.json ./
RUN npm install --production=false
COPY apps/backend/ ./
COPY packages/shared ../packages/shared
RUN npx prisma generate --schema=prisma/schema.prisma
EXPOSE 4000 4001
CMD ["npm", "run", "dev"]

FROM backend-base AS backend-build
RUN npm run build

FROM node:20-alpine AS backend-production
WORKDIR /app
RUN apk add --no-cache openssl
COPY apps/backend/package.json apps/backend/package-lock.json ./
RUN npm ci --omit=dev
COPY --from=backend-build /app/dist ./dist
COPY --from=backend-build /app/prisma ./prisma
COPY --from=backend-build /app/node_modules/.prisma ./node_modules/.prisma
EXPOSE 4000 4001
CMD ["node", "dist/server.js"]

# Frontend
FROM node:20-alpine AS frontend-base
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

FROM frontend-base AS frontend-build
ARG VITE_API_URL
ARG VITE_YJS_WS_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_YJS_WS_URL=$VITE_YJS_WS_URL
RUN npm run build

FROM nginx:1.27-alpine AS frontend-production
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend-build /app/dist /usr/share/nginx/html
EXPOSE 80
