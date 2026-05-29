# Contributing to Hexkit

Thanks for your interest in improving Hexkit! Bug reports, ideas, and pull
requests are all welcome.

## Licensing of contributions

Hexkit is distributed under the
[PolyForm Noncommercial License 1.0.0](./LICENSE). By submitting a contribution
you agree that it is licensed under the same terms, and that the maintainer may
also distribute it under separate commercial license terms.

## Development setup

```bash
pnpm install
make dev            # run the desktop app (Tauri, hot reload)
make web            # or run the frontend only in a browser
```

See the `Makefile` for all tasks (`make help`).

## Before opening a pull request

Run the full gate and make sure it is green:

```bash
make check          # typecheck + clippy + tests + build
```

- **Tests are required.** Tool logic lives in `crates/devtools-core` and is
  covered by Rust unit tests; UI/wiring is covered by Vitest. Add tests for new
  behavior and keep existing ones passing.
- **Rust:** `cargo fmt` and a clean `cargo clippy --workspace --all-targets -- -D warnings`.
- **TypeScript:** keep `pnpm typecheck` clean (strict mode, no unused locals).

## Adding a tool

1. Implement the pure logic as a module in `crates/devtools-core/src/` with a
   `dispatch(action, params)` function, and route it in `actions.rs`.
2. Add unit tests for the logic (happy path, edge cases, error cases).
3. Add the frontend under `src/tools/<name>/` (`api.ts`, `run.ts`, the view) and
   register it in `src/tools/registry.ts`.
4. Use `useToolState` for inputs/options so per-tab state persists.

## Conventions

- Small, focused modules; prefer immutable updates.
- Conventional commit messages (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`…).
- No secrets or credentials in code or tests.
