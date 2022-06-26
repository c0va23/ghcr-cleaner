// #!/usr/bin/env node

import {
  Octokit
} from '@octokit/core'
import {
  paginateRest
} from '@octokit/plugin-paginate-rest'

import {
  PackageCleaner
} from './cleaner.js'

const PaginableOctokit = Octokit.plugin(paginateRest)

const CONCURRENCY_SIZE = process.env.CONCURRENCY_SIZE !== undefined
  ? parseInt(process.env.CONCURRENCY_SIZE)
  : undefined

const {
  GH_TOKEN,
  OWNER,
  OWNER_TYPE,
  PACKAGE_NAME
} = process.env

console.log({
  OWNER,
  OWNER_TYPE,
  PACKAGE_NAME,
  CONCURRENCY_SIZE
})

const octokit = new PaginableOctokit({
  auth: GH_TOKEN
})

const cleaner = new PackageCleaner({
  octokit,
  owner: OWNER,
  ownerType: OWNER_TYPE,
  packageName: PACKAGE_NAME,
  concurrencySize: CONCURRENCY_SIZE
})

await cleaner.cleanPackage()
