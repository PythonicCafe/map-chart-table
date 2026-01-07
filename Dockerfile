FROM node:20-alpine

RUN apk update && apk add bash

RUN npm install -g npm@^9.0.0

WORKDIR /srv/app
COPY package.json package-lock.json /srv/app/
RUN cd /srv/app && npm install
COPY . /srv/app/
