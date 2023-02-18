import {
  chunk
} from 'lodash/array.js'
import {
  RequestError
} from '@octokit/request-error'

const second = 1000

async function wait (seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * second))
}

function isUntaggedPackageVersion (packageVersion) {
  return packageVersion.metadata.container.tags.length === 0
}

const DEFAULT_CONCURRENCY_SIZE = 5

export class PackageCleaner {
  #octokit
  #owner
  #ownerType
  #packageName
  #concurrencySize

  /**
    * @param {Object} options
    * @param {Octokit} options.octokit - Github client
    * @param {string} options.owner - package owner (user or organization)
    * @param {'user' | 'owner'} options.ownerType - package owner (user or organization)
    * @param {string} options.packageName - target package
    * @param {number} options.concurrencySize - delete batch size
    */
  constructor ({
    octokit,
    owner,
    ownerType,
    packageName,
    concurrencySize
  }) {
    this.#octokit = octokit

    this.#owner = owner
    this.#ownerType = ownerType
    this.#packageName = packageName

    this.#concurrencySize = concurrencySize ?? DEFAULT_CONCURRENCY_SIZE

    console.debug(`Concurrency size ${this.#concurrencySize}`)
  }

  async cleanPackage () {
    console.log('Start clean package')

    const owner = this.#owner
    const ownerType = this.#ownerType
    const packageName = this.#packageName

    while (true) {
      try {
        const packageVersionIterator = this.#octokit.paginate.iterator({
          method: 'GET',
          url: '/{ownerType}s/{owner}/packages/container/{packageName}/versions',
          headers: {
            Accept: 'application/vnd.github.v3+json'
          },
          owner,
          ownerType,
          packageName
        })

        for await (const packageVersions of packageVersionIterator) {
          const untaggedPackageVersions = packageVersions
            .data
            .filter(isUntaggedPackageVersion)

          for (const packageVersionChunk of chunk(untaggedPackageVersions, this.#concurrencySize)) {
            const deletePromises = packageVersionChunk.map(this.#deletePackageVersion.bind(this))

            await Promise.all(deletePromises).then(() => {
              console.debug('Chunk done')
            })
          }
        }

        break
      } catch (error) {
        await this.#catchRequestError(error)
      }
    }
  }

  async #deletePackageVersion ({ id }) {
    const packageVersionId = id

    const owner = this.#owner
    const ownerType = this.#ownerType
    const packageName = this.#packageName

    try {
      const deleteResult = await this.#octokit.request({
        method: 'DELETE',
        url: '/{ownerType}s/{owner}/packages/container/{packageName}/versions/{packageVersionId}',
        headers: {
          Accept: 'application/vnd.github.v3+json'
        },
        owner,
        ownerType,
        packageName,
        packageVersionId
      })

      console.info(`Delete ${packageVersionId} success`)

      return deleteResult
    } catch (error) {
      console.error(`Delete ${packageVersionId} error: ${error}`)

      throw error
    }
  }

  async #catchRequestError (error) {
    if (!(error instanceof RequestError)) {
      throw error
    }

    const retryAfterHeader = error.response?.headers['retry-after']
    const retryAfter = parseInt(retryAfterHeader)
    if (Number.isNaN(retryAfter)) {
      throw error
    }

    console.warn(`Retry after ${retryAfter} seconds`)

    await wait(retryAfter)
  }
}
