import * as GithubCore from '@actions/core'
import {
  getOctokitOptions,
  GitHub
} from '@actions/github/lib/utils.js'

import {
  PackageCleaner
} from './cleaner.js'

const githubToken = GithubCore.getInput('githubToken')
const packageName = GithubCore.getInput('packageName')
const owner = GithubCore.getInput('owner')
const ownerType = GithubCore.getInput('ownerType')

const octokit = new GitHub(getOctokitOptions(githubToken))

const packageCleaner = new PackageCleaner({
  octokit,
  owner,
  ownerType,
  packageName
})

await packageCleaner.cleanPackage()
