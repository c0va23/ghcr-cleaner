FROM node:18

COPY package.json package-lock.json ./

RUN npm ci

COPY ./src /opt/ghcr-cleaner/

CMD node /opt/ghcr-cleaner/action.js
