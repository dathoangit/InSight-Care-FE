FROM node:20.18.0-alpine AS deps

RUN npm i -g next react

RUN apk add --no-cache python3 make g++

COPY package*.json /tmp/app/

COPY yarn.lock /tmp/app/

RUN cd /tmp/app && yarn --network-timeout 1000000

COPY . /usr/src/app
RUN cp -a /tmp/app/node_modules /usr/src/app

WORKDIR /usr/src/app
RUN npm run build

CMD ["yarn", "start"]
