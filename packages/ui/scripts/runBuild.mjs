// @ts-check

import { exit } from 'process'
import { build } from './build.mjs'

async function runBuild() {
  try {
    build()
  } catch (e) {
    exit(1)
  }
}

runBuild()
