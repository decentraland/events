module.exports = {
  globDirectory: "src/",
  globPatterns: ["**/*.{ts,css,tsx,js,png,svg,json}"],
  swDest: "static/sw.js",
  ignoreURLParametersMatching: [/^utm_/, /^fbclid$/],
}
