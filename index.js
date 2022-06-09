//#!/usr/bin/env node


import { Octokit } from "@octokit/core"
import { RequestError } from "@octokit/request-error"

import {
    paginateRest,
} from "@octokit/plugin-paginate-rest";

const PaginableOctokit = Octokit.plugin(paginateRest)

const {
    GH_TOKEN,
    GH_ORG,
    PACKAGE_NAME,
} = process.env

console.log({
    GH_ORG,
    PACKAGE_NAME,
})

const octokit = new PaginableOctokit({
    auth: GH_TOKEN,
})

async function deletePackageVersion (packageVersionId) {
    return octokit.request({
        method: 'DELETE',
        url: '/orgs/{org}/packages/container/{package_name}/versions/{packageVersionId}',
        headers: {
            Accept: 'application/vnd.github.v3+json',
        },
        org: GH_ORG,
        package_name: PACKAGE_NAME,
        packageVersionId,
    })
}

const second = 1000

async function wait(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * second))
}


while (true) {
    try {
        const packageVersionIterator = octokit.paginate.iterator({
            method: 'GET',
            url: '/orgs/{org}/packages/container/{package_name}/versions',
            headers: {
                Accept: 'application/vnd.github.v3+json',
            },
            org: GH_ORG,
            package_name: PACKAGE_NAME,
        })

        for await (const packageVersions of packageVersionIterator) {
            const untaggedPackageVersions = packageVersions
                  .data
                  .filter(packageVersion =>
                      packageVersion.metadata.container.tags.length === 0
                  )
            const deleteVersions = untaggedPackageVersions.map(async (packageVersion) => {
                const packageVersionId = packageVersion.id

                try {
                    const deleteResult = await deletePackageVersion(packageVersionId)
                    console.info(`Delete ${packageVersionId} success`)
                } catch(error) {
                    console.error(`Delete ${packageVersionId} error: ${error}`)
                }
            })

            await Promise.all(deleteVersions).then(() => {
                console.info("Butch done")
            })
        }

        break
    } catch (error) {
        if (!(error instanceof RequestError)) {
            throw error
        }

        const retryAfter = parseInt(error.response.headers['retry-after'])

        console.warn(`Retry after ${retryAfter} seconds`)

        await wait(retryAfter)
    }
}

