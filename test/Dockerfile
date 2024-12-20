FROM node:21-alpine

WORKDIR /app
# Install Docker CLI
RUN apk update && apk add --no-cache docker-cli
COPY package*.json .

RUN npm install

COPY . .

CMD ["npm", "run" ,"test"]

