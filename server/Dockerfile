FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

EXPOSE 80

CMD [ "node", "server.js" ]