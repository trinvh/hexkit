# Plugin / Marketplace System — Architecture Evaluation

> Status: **exploratory** (not committed to). Drafted 2026-06-02.
> Goal: deliver new tools after release **without rebuilding the whole app**,
> hosted on a server and installable from Settings — while keeping Hexkit's
> offline + "nothing leaves the machine" guarantee intact.

## The core tension

Hexkit's defining rule is **"all tool logic lives in Rust, compiled into the
binary"** (`CLAUDE.md`). A plugin system has to break exactly that. The brand
promise — offline, nothing leaves the machine, curated and trustworthy — is the
constraint that rules out the easy answers. So the real question is not "which
plugin framework" but:

> How do we add late-bound tools **without** giving up the sandbox guarantee
> that makes Hexkit worth trusting?

A tool is two artifacts today, and a plugin must deliver both:

1. **Backend logic** — a Rust module exposing
   `dispatch(action, params) -> ToolResult<Value>`, AOT-compiled into the binary
   and routed by the `match` in `crates/devtools-core/src/actions.rs`. *This is
   the hard part.*
2. **Frontend UI** — a lazy-loaded React component in the Vite bundle, registered
   in `src/tools/registry.ts`.

Everything (desktop, `hexkit-cli`, `hexkit://` deep links) routes through
`devtools_core::run`, so anything we add to that dispatcher is reachable from all
three surfaces for free.

---

## Half 1 — delivering backend logic

| Option | Sandbox? | Cross-platform artifact | Offline-safe | Fit |
|---|---|---|---|---|
| **WASM (Extism / wasmtime)** | ✅ deny-by-default | ✅ one `.wasm` for all OS/arch | ✅ no network unless host grants it | **Best** |
| Native dyn libs (`.dylib`/`.dll`/`.so` + `libloading`) | ❌ full app privileges | ❌ per-OS/arch builds, macOS notarization pain | ❌ unrestricted | Bad |
| Embedded script VM (Rhai / mlua / rquickjs) | ✅ | ✅ | ✅ | OK for trivial tools only |
| Remote / server execution | n/a | n/a | ❌ **violates the whole premise** | Reject |

**WASM is the standout fit.** A WASM module is sandboxed by construction: no
ambient access to network or filesystem — it can only call host functions we
explicitly import. So "nothing leaves the machine" becomes a **mechanical**
guarantee, not a policy: if we never import an `http_fetch` host function, no
plugin can ever phone home. That's a selling point, not a compromise.

The dispatch contract maps onto WASM almost perfectly. Today:

```rust
pub fn run(action: &str, params: Value) -> ToolResult<Value>
```

A WASM plugin exports the moral equivalent — `dispatch(input_bytes) -> output_bytes`
where bytes are JSON. [Extism](https://extism.org) is purpose-built for this: a
Rust host SDK + plugin PDKs in many languages, JSON-in/JSON-out, with a capability
model. Integration is a fall-through arm in `actions.rs`:

```rust
_ => crate::plugins::dispatch(action, params),  // tries the loaded plugin registry
```

The CLI and deep-link paths inherit it automatically. Extism runs in a plain
headless binary, so `hexkit-cli` loads the same plugin directory.

**Costs:** plugin authors compile to `wasm32`; heavy host crates (`fancy-regex`,
`sxd-xpath`, …) can't be reused *inside* a plugin unless the plugin bundles them
(larger `.wasm`); small per-call serialization overhead. For a toolbox that is
almost entirely pure text→text transforms, none of this bites.

---

## Half 2 — delivering UI

The clever move: don't ship more React.

| Option | Code execution in WebView | Effort per plugin | Fit |
|---|---|---|---|
| **Schema-driven declarative UI** | ❌ none — host renders | very low | **Best for ~80% of tools** |
| Dynamic React / module federation | ⚠️ arbitrary JS in privileged context | high | Security hole |
| Sandboxed iframe + postMessage | ✅ isolated | high, clunky UX | Escape hatch only |

Nearly every tool in `registry.ts` is **input + a few options → output**, and the
shared primitives already exist: `TransformLayout`, `ResultLayout`/`ResultList`,
`Segmented`, `Toggle`, `TextField`. So a plugin's UI ships a **manifest** that
*declares* its surface rather than shipping code:

```jsonc
{
  "id": "rot13",
  "name": "ROT13",
  "category": "Encoders",
  "icon": "lock",                 // mapped to a bundled lucide icon, not arbitrary SVG
  "ui": {
    "layout": "transform",        // -> TransformLayout
    "options": [
      { "key": "variant", "type": "segmented", "values": ["rot13", "rot47"] }
    ],
    "output": "text"
  },
  "actions": ["rot13.run"],
  "engine": { "type": "wasm", "module": "rot13.wasm", "sha256": "…" }
}
```

The host renders that with existing components — **zero plugin JS in the WebView**,
which keeps the attack surface tiny and sidesteps CSP / React-version coupling.
Extend `ToolDefinition` with a `source: "builtin" | "plugin"` discriminator and a
`manifest` field; add a `PluginTool.tsx` that interprets the schema.

Visual / bespoke tools (color picker, QR, diff, certificate tree) **don't** fit a
schema — and that's fine. They stay first-party built-ins. The marketplace targets
the long tail of transform tools, which is where "I wish Hexkit had X" clusters.

> Note: a fully no-code plugin needs both a declarative UI **and** a declarative or
> composed transform. Declarative covers config-only tools; novel logic still needs
> WASM. The marketplace mostly wants WASM + schema UI together.

---

## Distribution / marketplace layer

```
Server (static, CDN-cacheable)
  └─ index.json          # signed registry: [{id, version, sha256, sig, manifest-url, wasm-url}]
        │
   download + verify (Ed25519 — already shipped via the PGP tools)
        │
Local: <app-data>/plugins/<id>/{manifest.json, tool.wasm}
        │
Startup: plugins::load_all() → merged into the dispatcher + tool registry
```

- **Index** — a single static JSON file on a server/CDN. No backend compute → cheap.
  The landing repo's Worker already reserves `/api/*` if dynamic search/ratings are
  wanted later.
- **Signing** — every plugin signed with the publisher key; host pins the public
  key and verifies signature + SHA-256 before loading. Tampered/unsigned → refused.
  Ed25519 primitives already exist in `crates/devtools-core` (the PGP suite), so
  verification is in-house.
- **Settings → Plugins tab** — browse the index, install/update/remove, show granted
  capabilities. Mirrors the MCP/stdio config tab.
- **Capabilities** — default-deny. Because the sandbox is real, "offline" holds
  unless we choose to import a network host fn — which, for brand reasons, we may
  choose to **never** do.

### Action-id / deep-link contract

Plugin actions must be namespaced so they can't collide with built-ins and so the
existing `toolIdForAction` routing keeps working — e.g. a reserved `plugin:` prefix
or a per-plugin namespace registered at load time. `ACTION_NAMESPACE_TO_TOOL` in
`registry.ts` would gain dynamic entries from loaded plugins.

---

## The one decision that changes everything

**First-party "tool packs" vs. open third-party marketplace.** Same architecture,
very different trust models:

- **First-party only** — *we* publish signed tool packs out-of-band so users get
  new tools without an app-store update cycle. Trust model is trivial (all ours,
  signed); WASM sandbox is pure defense-in-depth; no dilution of the curated brand.
  Slots cleanly into the planned paid-license channel ("Pro tool packs").
- **Open third-party** — anyone publishes. Now we own vetting, malware/quality
  review, abuse reporting, and **revocation** (a kill-list in the index). Much
  larger ongoing burden; dilutes the curated promise.

**Recommendation:** ship **first-party tool packs first**, prove the WASM +
schema-UI pipeline end to end, open to third parties only if demand is real. The
sandbox makes third-party *possible* later with no re-architecture.

### Second decision: how hard is the offline line?

Would we ever grant a plugin network access (WASM lets us withhold it absolutely),
or is fully-offline non-negotiable? This determines how much of the capability /
consent UI in phases 3–4 we actually build.

---

## Suggested phasing (each phase independently shippable)

0. **Manifest schema + `ToolDefinition` extension** — define the plugin contract;
   add `source`/`manifest` to the registry. No runtime yet.
1. **Schema-driven UI renderer** (`PluginTool.tsx`) — render declarative tools with
   existing primitives. Validate by re-expressing a couple of *built-in* simple
   tools as schemas. No WASM, no network. (Useful on its own: lets us add
   config-only tools faster even before plugins exist.)
2. **WASM runtime** (Extism in `devtools-core` + `src-tauri`) — dispatcher
   fall-through to a plugin registry loaded from a local dir. Drop a `.wasm` in by
   hand to test. CLI picks it up too.
3. **Signing + remote index + Settings install/update/remove** — the real
   "install from server" loop.
4. **Marketplace polish** — categories, search, optional Worker-backed ratings;
   revocation list if going third-party.

---

## Open questions / follow-ups

- First-party tool packs vs. open third-party marketplace? (drives phases 3–4)
- Is fully-offline non-negotiable, or is opt-in network a future capability?
- Extism vs. raw wasmtime — Extism gives ergonomics + multi-language PDKs; raw
  wasmtime gives more control and one fewer dependency. Lean Extism unless the
  dependency weight is a concern.
- Plugin SDK/template: a `cargo generate` template so plugin authors get the
  JSON-in/JSON-out boilerplate for free.
- Versioning/compat: manifest declares a host API version; host refuses
  incompatible plugins.
- How plugins surface in the CLI (`hexkit <plugin-action> '<json>'`) and in the
  Raycast extension's `tools.ts` catalog (cross-repo contract).
