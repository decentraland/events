FROM node:12-alpine

WORKDIR /app

COPY . app

RUN npm run build

ENTRYPOINT [ "npm" "run" "production" ]