# Contributing to @appvideostudio/sdk

Thanks for your interest in contributing to the AppVideoStudio SDK!

## How the SDK is maintained

The source-of-truth files live in the private AppVideoStudio app repo. Changes flow outward to this public SDK repo via a sync script before each release. This means:

- **Bug fixes to SDK source files** (document helpers, player element, message client, protocol) should be reported as issues here. The fix will be made in the app repo and synced out.
- **SDK-specific files** (`index.js`, `test-harness.js`, type declarations) can accept direct pull requests.
- **Documentation improvements** (README, CHANGELOG) are welcome as pull requests.

## Reporting issues

Open an issue on this repo with:

1. What you expected to happen
2. What actually happened
3. A minimal reproduction (code snippet or repo link)
4. Your environment (Node version, browser, bundler)

## Development

```bash
# Install (no dependencies to install — the SDK is zero-dependency)
npm pack --dry-run  # verify package contents

# Test imports
node -e "import('@appvideostudio/sdk')"
node -e "import('@appvideostudio/sdk/document')"
```

## Pull requests

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Ensure all imports still resolve
4. Submit a pull request with a clear description of the change

## Code style

- ES modules (`import`/`export`)
- No build step — source files are the published files
- JSDoc comments for public APIs
- Matching `.d.ts` type declarations for every `.js` file

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
