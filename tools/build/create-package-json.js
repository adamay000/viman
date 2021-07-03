/**
 * @file Create package.json file for electron application. Electron requires one for packaged application.
 *     See {@link https://www.electron.build/tutorials/two-package-structure official description}.
 */

const { readFile, writeFile } = require('fs')
const { resolve } = require('path')
const { promisify } = require('util')

const BASE_DIR = resolve(__dirname, '../../')
const BUILD_DIR = resolve(BASE_DIR, './build')

async function main() {
  const from = resolve(BASE_DIR, 'package.json')
  const to = resolve(BUILD_DIR, 'package.json')
  const encoding = 'utf8'

  const packageJson = JSON.parse(await promisify(readFile)(from, { encoding }))

  delete packageJson.build
  delete packageJson.scripts
  delete packageJson.devDependencies

  packageJson.main = './main.js'

  await promisify(writeFile)(to, JSON.stringify(packageJson, null, 2), { encoding })
}

main()
