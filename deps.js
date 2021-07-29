// "deps": "DOTENV_CONFIG_PATH=.env.development DATABASE=false JOBS=false HTTP=false ts-node -r dotenv/config.js -r ./src/server.ts deps.js",
import { relative } from 'path'
import { statSync } from 'fs'

let total = 0
let files = 0
const cwd = process.cwd()
Object.keys(require.cache)
  .map(file => {
    if (file !== __filename) {
      const stats = statSync(file)
      console.log(relative(cwd, file), stats.size)
      total += stats.size
      files++
    }
  })

console.log(`files: ${files} (${Number((total/(1024*1024)).toFixed(2))}mb)`)
process.exit(0)
