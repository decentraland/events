FROM node:12-alpine

WORKDIR /app

COPY . /app

RUN apk update && \
  apk --no-cache upgrade && \
  apk --no-cache add git && \
  npm install --unsafe-perm && \
  rm -rf /var/cache/apk/*

RUN rm -rf node_modules

RUN npm install

RUN npm run build

ENTRYPOINT [ "./entrypoint.sh" ]