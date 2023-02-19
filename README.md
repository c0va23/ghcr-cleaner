# GHCR Cleaner

GHCR Cleaner is Github Action that cleans up your Github Container Registry.
All images without tags will be deleted.

## Usage

Minimal example:

```yaml
name: ghcr-clean
run-name: Clean Github Container Registry

on:
  schedule:
  # Every day at 00:00 by UTC
  - cron: '0 0 * * *'

env:
  PACKAGE_NAME: ghcr-cleaner

jobs:
  ghcr-clean:
    runs-on: ubuntu-20.04
    steps:
    - uses: c0va23/ghcr-cleaner@776e554de98736b52b473ee2b2b1759e6ef35707
      with:
        githubToken: ${{ secrets.GITHUB_TOKEN }}
        packageName: ${{ env.PACKAGE_NAME }}
        owner: ${{ github.repository_owner }}
        ownerType: org
```

### Inputs

All inputs are required.

| Name | Description |
| --- | --- |
| `githubToken` | Github token with `read:packages` and `delete:packages` scopes |
| `packageName` | Package name |
| `owner` | Owner of package |
| `ownerType` | Owner type. Can be `user` or `org` |

## License

MIT License
