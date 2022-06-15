FROM node:18

COPY package.json package-lock.json ./

RUN npm ci

COPY ./src ./src

CMD node ./src/action.js
