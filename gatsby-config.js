module.exports = {
  siteMetadata: {
    title: `Decentraland Events`,
    description: `Decentraland Events`,
    author: `@decentraland`,
  },
  proxy: {
    prefix: "/api",
    url: "http://localhost:3001",
  },
  plugins: [
    `gatsby-plugin-react-helmet`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`,
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `Decentraland`,
        short_name: `starter`,
        start_url: `/`,
        background_color: `#663399`,
        theme_color: `#663399`,
        display: `minimal-ui`,
        icon: `src/images/decentraland.svg`, // This path is relative to the root of the site.
      },
    },
    `gatsby-plugin-sass`,
    {
      resolve: `gatsby-plugin-typescript`,
      options: {
        isTSX: true, // defaults to false
        // jsxPragma: `jsx`, // defaults to "React"
        allExtensions: true, // defaults to false,
      },
    },
    // this (optional) plugin enables Progressive Web App + Offline functionality
    // To learn more, visit: https://gatsby.dev/offline
    // `gatsby-plugin-offline`,
    // `gatsby-plugin-i18n`,
    {
      resolve: "gatsby-plugin-intl",
      options: {
        // language JSON resource path
        path: `${__dirname}/src/intl`,
        // supported language
        languages: [`en` /*, `es`, `zh` */],
        // language file path
        defaultLanguage: `en`,
        // option to redirect to `/ko` when connecting `/`
        redirect: true,
      },
    },
    // {
    //   resolve: `gatsby-plugin-segment-js`,
    //   options: {
    //     // your segment write key for your production environment
    //     // when process.env.NODE_ENV === 'production'
    //     // required; non-empty string
    //     prodKey: `PjfvH193hXJe4H4GkGvLxaoSQlNnU4Ba`,

    //     // if you have a development env for your segment account, paste that key here
    //     // when process.env.NODE_ENV === 'development'
    //     // optional; non-empty string
    //     devKey: `PjfvH193hXJe4H4GkGvLxaoSQlNnU4Ba`,

    //     // boolean (defaults to false) on whether you want
    //     // to include analytics.page() automatically
    //     // if false, see below on how to track pageviews manually
    //     trackPage: true,
    //   },
    // },
    // {
    //   resolve: 'gatsby-plugin-load-script',
    //   options: {
    //     disable: !process.env.SENTRY_DSN, // When do you want to disable it ?
    //     src: 'https://browser.sentry-cdn.com/5.5.0/bundle.min.js',
    //     onLoad: `() => Sentry.init({dsn:"${process.env.SENTRY_DSN}"})`,
    //   },
    // },
  ],
}
