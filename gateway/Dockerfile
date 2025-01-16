FROM node:21-alpine

WORKDIR /app

COPY package*.json .

RUN npm ci

COPY . .

RUN npm run build

EXPOSE 8198 8197 8098

CMD ["npm", "start"]


