FROM node:20-alpine

RUN apk update && apk upgrade

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV NODE_ENV=production

EXPOSE 5050

CMD [ "npm", "start" ]