/* eslint-disable */
const {
  default: developMiddleware,
} = require("decentraland-gatsby/dist/utils/development/developMiddleware")

module.exports = {
  siteMetadata: {
    title: `Decentraland`,
    description: `Decentraland`,
    author: `@decentraland`,
  },
  developMiddleware: developMiddleware([
    {
      prefix: `/api`,
      url: `http://127.0.0.1:4000`,
    },
    {
      prefix: `/poster`,
      url: `https://events.decentraland.zone`,
    },
  ]),
  plugins: [
    `gatsby-plugin-react-helmet`,
    `gatsby-plugin-postcss`,
    `gatsby-plugin-image`,
    `gatsby-plugin-sharp`,
    `gatsby-transformer-sharp`,
    {
      resolve: "gatsby-plugin-sri",
      options: {
        hash: "sha512", // 'sha256', 'sha384' or 'sha512' ('sha512' = default)
        crossorigin: false, // Optional
      },
    },
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `Decentraland Events`,
        short_name: `Events`,
        start_url: `/`,
        background_color: `#ff2d55`,
        theme_color: `#ff2d55`,
        display: `minimal-ui`,
        icon: `node_modules/decentraland-gatsby/static/decentraland.svg`, // This path is relative to the root of the site.
      },
    },
    // {
    //   resolve: `gatsby-plugin-typescript`,
    //   options: {
    //     isTSX: true, // defaults to false
    //     // jsxPragma: `jsx`, // defaults to `React`
    //     allExtensions: true, // defaults to false,
    //   },
    // },
    // this (optional) plugin enables Progressive Web App + Offline functionality
    // To learn more, visit: https://gatsby.dev/offline
    // `gatsby-plugin-offline`,
    {
      resolve: `decentraland-gatsby/dist/plugins/intl`,
      options: {
        // language JSON resource path
        paths: [`${__dirname}/src/intl`],
        // supported language
        locales: [`en` /*, `es`, `zh` */],
        // language file path
        defaultLocale: `en`,
        // option to redirect to `/ko` when connecting `/`
      },
    },
  ],
}
