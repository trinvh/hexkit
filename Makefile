# Hexkit — task runner. Run `make` (or `make help`) to list targets.
# Ensure the rustup toolchain is on PATH even in non-login shells.
export PATH := $(HOME)/.cargo/bin:$(PATH)

# Host Rust target — needed so `cargo build --target …` picks the same triple
# Tauri expects for sidecar binaries (e.g. binaries/hexkit-aarch64-apple-darwin).
HOST_TARGET := $(shell rustc -Vv 2>/dev/null | sed -n 's/^host: //p')
SIDECAR_EXT := $(if $(findstring windows,$(HOST_TARGET)),.exe,)
SIDECAR_PATH := src-tauri/binaries/hexkit-cli-$(HOST_TARGET)$(SIDECAR_EXT)

.DEFAULT_GOAL := help

## ----- Setup -----

install: ## Install JS + Rust dependencies
	pnpm install
	cargo fetch

## ----- Develop -----

dev: cli-sidecar ## Run the desktop app (Tauri, hot-reload)
	pnpm tauri dev

web: ## Run the frontend only in a browser (http://localhost:1420)
	pnpm dev

watch: ## Run frontend tests in watch mode
	pnpm test:watch

## ----- Build -----

build: ## Build the production frontend bundle (tsc + vite)
	pnpm build

bundle: cli-sidecar ## Build the distributable desktop app (Tauri installer/app)
	pnpm tauri build

# Build a debug-profile .app bundle and "open" it so macOS Launch Services
# registers the `hexkit://` scheme. After running this once you can iterate
# with `make dev` and `hexkit://` URLs (from Raycast, the CLI, anywhere) will
# launch the bundled app — deep links *don't* reach the raw `tauri dev`
# binary because it has no Info.plist for LS to route to.
dev-bundle: cli-sidecar ## Build + register a debug .app so hexkit:// works during dev
	pnpm tauri build --debug
	@APP=$$(ls -dt src-tauri/target/debug/bundle/macos/*.app 2>/dev/null | head -1); \
	if [ -z "$$APP" ]; then \
		echo "error: no .app bundle was produced" >&2; exit 1; \
	fi; \
	echo "Registering $$APP with Launch Services…"; \
	/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f "$$APP"; \
	open "$$APP"; \
	echo; \
	echo "Done. Try: open 'hexkit://json.format?input=%7B%22a%22%3A1%7D'"

cli: ## Build the headless `hexkit` CLI (release)
	cargo build --release -p hexkit-cli
	@echo "Built target/release/hexkit"

cli-sidecar: ## Build and stage the CLI sidecar Tauri bundles into the app
	@cargo build --release -p hexkit-cli --target $(HOST_TARGET)
	@mkdir -p src-tauri/binaries
	@cp target/$(HOST_TARGET)/release/hexkit$(SIDECAR_EXT) $(SIDECAR_PATH)
	@echo "Sidecar staged: $(SIDECAR_PATH)"

## ----- Test -----

test: test-rust test-web ## Run all tests (Rust + frontend)

test-rust: ## Run the Rust workspace tests
	cargo test --workspace

test-web: ## Run the frontend (Vitest) tests
	pnpm test

coverage: ## Run frontend tests with a coverage report
	pnpm test:coverage

## ----- Quality -----

check: typecheck lint test build ## Full gate: typecheck, lint, tests, build

typecheck: ## Type-check the frontend (tsc --noEmit)
	pnpm typecheck

lint: ## Lint Rust with clippy (warnings = errors)
	cargo clippy --workspace --all-targets -- -D warnings

fmt: ## Format Rust code (cargo fmt)
	cargo fmt --all

fmt-check: ## Verify Rust formatting without writing
	cargo fmt --all --check

## ----- Release -----

# Bump the version in Cargo workspace + tauri.conf.json + package.json.
# Usage: make bump VERSION=0.2.0
bump: ## Bump every version-of-record (VERSION=X.Y.Z)
	@if [ -z "$(VERSION)" ]; then \
		echo "error: VERSION is required, e.g. make bump VERSION=0.2.0"; exit 2; \
	fi
	@node scripts/bump.mjs $(VERSION)

# Full release flow: bump, gate, commit, tag, push.
# Usage: make release VERSION=0.2.0
release: ## Bump + run gate + commit + tag + push (VERSION=X.Y.Z)
	@if [ -z "$(VERSION)" ]; then \
		echo "error: VERSION is required, e.g. make release VERSION=0.2.0"; exit 2; \
	fi
	@node scripts/bump.mjs $(VERSION)
	@$(MAKE) check
	@git add Cargo.toml Cargo.lock src-tauri/tauri.conf.json package.json
	@git commit -m "chore: release v$(VERSION)"
	@git tag -a "v$(VERSION)" -m "Hexkit v$(VERSION)"
	@echo
	@echo "Tagged v$(VERSION). To publish, push both:"
	@echo "  git push origin $$(git rev-parse --abbrev-ref HEAD)"
	@echo "  git push origin v$(VERSION)"

## ----- Maintenance -----

clean: ## Remove build artifacts (target, dist, coverage)
	cargo clean
	rm -rf dist coverage

help: ## Show this help
	@grep -hE '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

.PHONY: install dev web watch build bundle dev-bundle cli cli-sidecar test \
	test-rust test-web coverage check typecheck lint fmt fmt-check bump \
	release clean help
