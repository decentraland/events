install decentraland-gatsby@5

```bash
npm install gatsby@4 decentraland-gatsby@4
```

remove deprecated dependencies

```bash
npm rm gatsby-image gatsby-plugin-intl
```

update dependencies compatibles with gatsby@4

```bash
npm install \
  gatsby-plugin-image@2 \
  gatsby-plugin-manifest@4 \
  gatsby-plugin-offline@5 \
  gatsby-plugin-react-helmet@5 \
  gatsby-plugin-sharp@4 \
  gatsby-plugin-typescript@4 \
  gatsby-source-filesystem@4 \
  gatsby-transformer-sharp@4 \
  postcss@8 \
  core-js@3 \
  @gatsbyjs/reach-router@1 \
  @reach/router@1 \
  typescript@4 \
  postcss-assets@6 \
  postcss-svg@3 \
  autoprefixer@3
```

replace `@reach/router` with `@gatsbyjs/reach-router`,

replace `gatsby-plugin-intl` with `decentraland-gatsby/dist/plugins/intl`:

```js

    {
      resolve: `gatsby-plugin-intl`,
      options: {
        // language JSON resource path
        path: `${__dirname}/src/intl`,
        // supported language
        languages: [`en` /*, `es`, `zh` */],
        // language file path
        defaultLanguage: `en`,
        // option to redirect to `/ko` when connecting `/`
        redirect: false,
      },
    },
```

for

```js
{
  resolve: `decentraland-gatsby/dist/plugins/intl`,
  options: {
    // language JSON resource path
    paths: [
      `${__dirname}/src/intl`
    ],
    // supported language
    languages: [`en` /*, `es`, `zh` */],
    // language file path
    defaultLanguage: `en`,
    // option to redirect to `/ko` when connecting `/`
  },
}
```

update node in `Dockerfile`

```Dockerfile
FROM node:12-alpine
```

for

```Dockerfile
FROM node:16-alpine
```
