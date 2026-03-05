FROM node:20-alpine

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm i --legacy-peer-deps --omit=dev

COPY . .

USER appuser

EXPOSE 5000

CMD ["node", "src/server.js"]