# Stage 1: install deps
FROM node:20-alpine AS builder
WORKDIR /app

# Copy only package info, install production deps
COPY package.json ./
RUN npm install --omit=dev

# Copy the proxy code
COPY index.cjs ./

# Stage 2: runtime
FROM node:20-alpine
WORKDIR /app

# Copy built files
COPY --from=builder /app /app
ENV NODE_ENV=production

EXPOSE 4000
ENTRYPOINT ["npm", "start"]

