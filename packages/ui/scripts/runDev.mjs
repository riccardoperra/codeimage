// @ts-check

import path from 'path'
import { exit } from 'process'
import { fileURLToPath } from 'url'
import { watch } from 'chokidar'

import { build } from './build.mjs'

// @ts-expect-error
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const root = path.resolve(__dirname, '..')
const projectName = path.basename(root)

const watchFolder = path.resolve(root, 'src')

function runDev() {
  try {
    console.log(`[${projectName}] Dev mode enabled`)

    /** @type {string[]} */
    let batchedChanges = []

    /** @type {NodeJS.Timeout} */
    let timeId

    watch([watchFolder], { persistent: true, ignoreInitial: true })
      .on('ready', () => {
        batchedChanges = []
        console.log(`[${projectName}] Watch server ready.`)
      })
      .on('all', (_event, path) => {
        clearTimeout(timeId)
        batchedChanges.push(path)

        timeId = setTimeout(async () => {
          console.log()
          console.log(`[${projectName}] Changed files`)
          console.log(batchedChanges.join('\n'))
          console.log()

          await build()
          batchedChanges = []
          console.log(`[${projectName}] Build complete.`)
        }, 200)
      })
  } catch (e) {
    exit(1)
  }
}

runDev()
