# AGENTS.md

dsh-rename is a standalone plugin repository for
[DeepSeek Harness](https://github.com/deepseek-ai/DeepSeek-Harness) (DSH). It
adds one slash command, `/rename`: with an argument it renames the current
session directly; without an argument the model reads the conversation and
picks the title.

## Where things live

```
src/
  index.ts    plugin entry: /rename command registration and dispatch
  config.ts   Config schema, defaults, and strict runtime validation
  title.ts    transcript collection, byte-bounded framing, LLM title call
tests/
  command.spec.ts   command registration, explicit/generated paths, errors
  title.spec.ts     transcript collection and byte-budget fitting
scripts/
  verify.mjs        release smoke check over the built entry and bundle patch
docs/
  usage.md          authoritative behavior reference
```

## Non-negotiables

- **Never fork DSH internals.** Depend on the published `@deepseek-ai/dsh-*`
  packages and the public command, session-title, and LLM seams.
- **The plugin writes no custom session events.** Every rename is a built-in
  `session/title` event committed by `ctx.sessionTitle.rename`, so sessions
  stay readable by any DSH build.
- **No second auto-naming path.** DSH's base bundle already mounts
  `session-title-first-prompt-llm`; this plugin does not register a title
  provider.
- **Registration is an effect.** The `/rename` registration is wrapped in
  `ctx.effect` and unregisters when the plugin fiber is disposed.
- **No hardcoded tunables in plugin logic.** Every deployment-varying choice
  is a validated `Config` field with a default; misconfiguration fails loud
  at load.
- **Model-facing output is bounded and sanitized.** Transcript input honors
  `maxInputBytes`; generated titles pass `normalizeSessionTitle` and
  `maxTitleBytes`.
- **Every commit builds and tests green.** `pnpm verify` must pass before
  commit.
- Files end with exactly one trailing newline; `git diff --cached --check`
  must pass.

## Conventions

- ESM everywhere; `"type": "module"`.
- Source imports use explicit `.ts` extensions; `tsc` rewrites them on emit
  (`rewriteRelativeImportExtensions`).
- `tsconfig.json` is the shared strict program (dev, `noEmit`, includes
  tests); `tsconfig.build.json` extends it with `rootDir: src`,
  `outDir: lib/types`.
- Tests live under `tests/` and describe behavior, not implementation.
- Closed unions end in exhaustive switches; merge-extensible unions (session
  events, content blocks, finish reasons) fall through a documented default.

## Commands

```sh
pnpm install      # pnpm workspaces, node ^22.19 || >=24
pnpm typecheck
pnpm test         # vitest unit tests
pnpm build        # tsc emits lib/types
pnpm verify       # typecheck + test + build + release smoke check
```
