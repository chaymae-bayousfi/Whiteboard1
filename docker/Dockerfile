# Backend
FROM node:20-alpine AS backend-base
WORKDIR /app
RUN npm install -g tsx
COPY apps/backend/package.json ./
RUN npm install --production=false
COPY apps/backend/ ./
COPY packages/shared ../packages/shared
EXPOSE 4000 4001
CMD ["npm", "run", "dev"]

# Frontend
FROM node:20-alpine AS frontend-base
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
