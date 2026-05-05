/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/node-apis/
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path")

// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharp = require("sharp")
// eslint-disable-next-line @typescript-eslint/no-var-requires
const webpack = require("webpack")
sharp.cache(false)
sharp.simd(false)

// You can delete this file if you're not using it
exports.onCreateWebpackConfig = ({ actions, stage }) => {
  const config = {
    plugins: [
      new webpack.NormalModuleReplacementPlugin(/node:/, (resource) => {
        resource.request = resource.request.replace(/^node:/, "")
      }),
    ],
    resolve: {
      fallback: {
        assert: false,
        crypto: false,
        http: false,
        https: false,
        os: false,
        stream: false,
        util: false,
        url: false,
        path: false,
        diagnostics_channel: false,
      },
      alias: {
        // Fix ua-parser-js@2.x ESM syntax bug - force CJS files
        // The .mjs files have invalid import syntax: { name: alias } instead of { name as alias }
        "ua-parser-js/helpers": path.join(
          __dirname,
          "node_modules/ua-parser-js/src/helpers/ua-parser-helpers.js"
        ),
        "ua-parser-js/device-detection": path.join(
          __dirname,
          "node_modules/ua-parser-js/src/device-detection/device-detection.js"
        ),
        "ua-parser-js/bot-detection": path.join(
          __dirname,
          "node_modules/ua-parser-js/src/bot-detection/bot-detection.js"
        ),
        "ua-parser-js/browser-detection": path.join(
          __dirname,
          "node_modules/ua-parser-js/src/browser-detection/browser-detection.js"
        ),
        "ua-parser-js/extensions": path.join(
          __dirname,
          "node_modules/ua-parser-js/src/extensions/ua-parser-extensions.js"
        ),
        "ua-parser-js/enums": path.join(
          __dirname,
          "node_modules/ua-parser-js/src/enums/ua-parser-enums.js"
        ),
      },
    },
  }

  // During SSR, replace WearablePreview with a dummy module to avoid window access
  if (stage === "build-html" || stage === "develop-html") {
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /decentraland-ui2\/dist\/components\/WearablePreview\/WearablePreview/,
        require.resolve("./src/utils/wearable-preview-ssr-stub.js")
      )
    )
  }

  actions.setWebpackConfig(config)
}
