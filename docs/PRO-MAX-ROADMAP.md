# Web Search Pro Max roadmap

Baseline: upstream 0.2.4 (40ee20b3393591801266bbb676b725a1d7b1962f).

- P0: separate package/config/provider/RPC/storage identity, preserve MIT and upstream attribution. Keep upstream tool names for compatibility; do not co-enable forks.
- P0: anonymous-first routing, paid or unknown-cost sources opt-in. Audit explicit source calls, custom providers, fetch and judge budgets before claiming strict zero cost.
- P0: build and install on Windows/Linux; verify actual Desktop Alpha host and existing stable peer baselines. Do not widen peer ranges blindly.
- P0: explicit native provider selection and unload tests; no host patching.
- P1: expand no-key engines through existing registry, compare search quality against upstream and native providers. Respect service terms/rate limits.
- P1: latency, bounded parallelism, cache correctness and measured SQLite pressure; reuse existing pipeline and benchmark harness.
- P2: fast/smart/research modes, evidence quality, settings/diagnostics, optional MCP and CLI.

Release gates: package build, typecheck, existing tests, benchmark tests, install/disable/re-enable smoke test, no unintended paid requests. Publish only the Max package with authorized credentials. No live-search or Alpha compatibility claims without actual results.
