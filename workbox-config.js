export default {
  globDirectory: "public/",
  globPatterns: ["**/*.{html,css,js,jpg,png,svg,json}"],
  swDest: "public/sw.js",
  ignoreURLParametersMatching: [/^utm_/, /^fbclid$/],
}
