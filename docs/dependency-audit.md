# Dependency audit policy

The October 8, 2026 CI failure was caused by new dependency advisories. Lint, TypeScript, the client build, and the Docker build passed on the failing main commit.

Both lockfiles have been refreshed to patched compatible releases. The client overrides postcss-selector-parser to >=7.1.6 because some Tailwind 3 dependencies otherwise retain its vulnerable major version. The production CSS build validates compatibility. The build-only tailwindcss-animate plugin is now correctly classified as a devDependency. Server development uses Node's built-in watch mode instead of nodemon, removing its vulnerable braces dependency.

## Temporary client build exception

- Advisory: https://github.com/advisories/GHSA-vfj7-8cjw-p6xm
- Package: braces, exactly 3.0.3
- Scope: development dependencies only (verified against every affected lockfile path)
- Expiration: November 8, 2026 at 00:00 UTC
- Reason: upstream has no patched release. Tailwind 3 build tools use this package to process repository-controlled patterns; it is not part of the browser runtime. Do not pass untrusted patterns to these tools.
- Removal: adopt a patched braces release when available or separately migrate the Tailwind toolchain, then remove the exception and restore the plain all-dependencies audit command.

The client job still runs npm audit --omit=dev --audit-level=moderate without exceptions. It then audits the complete dependency graph, permitting only the advisory above and its inherited dependency findings. Any other moderate-or-higher advisory fails. The exception also fails if braces enters production dependencies, its version changes, or its deadline passes. Audit errors and malformed responses fail closed. Tests exercise these boundaries.

The server retains its original all-dependencies moderate audit gate and has zero reported vulnerabilities after the updates. This exception is an explicit temporary acceptance of a build-tool risk, not a claim that braces is patched.
