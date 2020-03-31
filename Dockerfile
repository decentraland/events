FROM node:12-alpine

WORKDIR /app

COPY ./migrations        /app/migrations
COPY ./src               /app/src
COPY ./entrypoint.sh     /app/entrypoint.sh
COPY ./gatsby-browser.js /app/gatsby-browser.js
COPY ./gatsby-config.js  /app/gatsby-config.js
COPY ./gatsby-node.js    /app/gatsby-node.js
COPY ./gatsby-ssr.js     /app/gatsby-ssr.js
COPY ./gatsby-ssr.js     /app/gatsby-ssr.js
COPY ./package-lock.json /app/package-lock.json
COPY ./package.json      /app/package.json
COPY ./tsconfig.json     /app/tsconfig.json

RUN apk update && \
  apk --no-cache upgrade && \
  apk --no-cache add git && \
  rm -rf /var/cache/apk/*

RUN rm -rf node_modules

RUN npm install --unsafe-perm

RUN npm run build

ENTRYPOINT [ "./entrypoint.sh" ]