FROM node:18.8-alpine as compiler

RUN apk add --no-cache openssh-client \
 && mkdir ~/.ssh && ssh-keyscan github.com > ~/.ssh/known_hosts

RUN apk add --no-cache --virtual native-deps \
  g++ gcc libgcc libstdc++ linux-headers make automake autoconf libtool python3 \
  util-linux \
  git \
  openssh \
  shadow \
  musl-dev \
  pkgconf

RUN apk add --no-cache tini

WORKDIR /app
COPY ./package-lock.json    /app/package-lock.json
COPY ./package.json         /app/package.json

RUN npm ci

ARG NODE_MAX_OLD_SPACE_SIZE=6144
ENV NODE_OPTIONS=--max-old-space-size=${NODE_MAX_OLD_SPACE_SIZE}

COPY ./src                  /app/src
COPY ./templates            /app/templates
COPY ./.env                 /app/.env.production
COPY ./entrypoint.sh        /app/entrypoint.sh
COPY ./tsconfig.json        /app/tsconfig.json

RUN npm run build
RUN npm prune --production

FROM node:18.8-alpine
WORKDIR /app

RUN rm -rf \
  /usr/local/lib/node_modules/npm/ \
  /usr/local/bin/npm \
  /usr/local/bin/npx \
  /usr/local/bin/corepack \
  /usr/local/bin/yarn \
  /usr/local/bin/yarnpkg \
  /opt/yarn-*

COPY --from=compiler /sbin/tini                /sbin/tini
COPY --from=compiler /app/package.json         /app/package.json
COPY --from=compiler /app/package-lock.json    /app/package-lock.json
COPY --from=compiler /app/node_modules         /app/node_modules
COPY --from=compiler /app/lib                  /app/lib
COPY --from=compiler /app/templates            /app/templates
COPY --from=compiler /app/entrypoint.sh        /app/entrypoint.sh

VOLUME [ "/data" ]

ENTRYPOINT ["/sbin/tini", "--", "/app/entrypoint.sh"]
