FROM node:21-alpine

WORKDIR /app

COPY . .

RUN npm install supertest jest

CMD ["npx", "jest" ,"integration.test.ts"]

