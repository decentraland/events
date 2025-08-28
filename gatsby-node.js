/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/node-apis/
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharp = require("sharp")
// eslint-disable-next-line @typescript-eslint/no-var-requires
const webpack = require("webpack")
sharp.cache(false)
sharp.simd(false)

// You can delete this file if you're not using it
exports.onCreateWebpackConfig = ({ actions, stage }) => {
  actions.setWebpackConfig({
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
      },
    },
  })

  // Fix for SSR issues with decentraland-ui2 components
  if (stage === "build-html" || stage === "develop-html") {
    actions.setWebpackConfig({
      externals: {
        "decentraland-ui2": "commonjs decentraland-ui2",
      },
    })
  }
}
