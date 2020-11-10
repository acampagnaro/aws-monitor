FROM node:14-alpine

RUN apk update && apk upgrade && \
    apk add --no-cache bash

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY package*.json ./

USER node

RUN npm install

RUN npm build

COPY --chown=node:node . .

EXPOSE 6666

CMD [ "node", "./index.js" ]