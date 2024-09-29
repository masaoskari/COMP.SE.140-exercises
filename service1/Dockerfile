FROM node:21-alpine

# To get working -x flag in ps command in alpine image we need to install procps package. 
# Here we would use bullseye as base image but its a lot bigger so its better to use alpine.
# See for eg: https://github.com/dotnet/vscode-csharp/issues/2165
RUN apk update && apk add --no-cache procps

WORKDIR /app

COPY package*.json .

RUN npm install

COPY . .

RUN npm run build

EXPOSE 8199

CMD ["npm", "start"]


