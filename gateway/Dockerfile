FROM node:21-alpine

WORKDIR /app

COPY package*.json .

RUN npm install

COPY . .

RUN npm ci

EXPOSE 8198 8197 8098

CMD ["npm", "start"]


