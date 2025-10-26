# Vendored Redocly CLI (offline stub)

This directory vendors a lightweight, offline-compatible replacement for the `@redocly/cli`
`redocly lint` entrypoint. The script mirrors the CLI surface we depend on so CI can operate
without reaching npm. It validates the OpenAPI document using structural checks that match our
fallback linter and exits with the same status codes the real CLI would use.

Version: 0.0.0-offline-stub
Source: in-repo implementation (`tools/redocly-cli/redocly`).
