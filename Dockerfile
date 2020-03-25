FROM node:12-alpine

WORKDIR /app

COPY . /app

RUN rm -rf node_modules

RUN npm install

RUN npm run build

ENTRYPOINT [ "npm" "run" "production" ]