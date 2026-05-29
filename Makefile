# Hexkit — task runner. Run `make` (or `make help`) to list targets.
# Ensure the rustup toolchain is on PATH even in non-login shells.
export PATH := $(HOME)/.cargo/bin:$(PATH)

.DEFAULT_GOAL := help

## ----- Setup -----

install: ## Install JS + Rust dependencies
	pnpm install
	cargo fetch

## ----- Develop -----

dev: ## Run the desktop app (Tauri, hot-reload)
	pnpm tauri dev

web: ## Run the frontend only in a browser (http://localhost:1420)
	pnpm dev

watch: ## Run frontend tests in watch mode
	pnpm test:watch

## ----- Build -----

build: ## Build the production frontend bundle (tsc + vite)
	pnpm build

bundle: ## Build the distributable desktop app (Tauri installer/app)
	pnpm tauri build

cli: ## Build the headless `hexkit` CLI (release)
	cargo build --release -p hexkit-cli
	@echo "Built target/release/hexkit"

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

## ----- Maintenance -----

clean: ## Remove build artifacts (target, dist, coverage)
	cargo clean
	rm -rf dist coverage

help: ## Show this help
	@grep -hE '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

.PHONY: install dev web watch build bundle cli test test-rust test-web \
	coverage check typecheck lint fmt fmt-check clean help
