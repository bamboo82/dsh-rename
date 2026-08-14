# dsh-rename

[![test](https://github.com/lmst2/dsh-rename/actions/workflows/test.yml/badge.svg)](https://github.com/lmst2/dsh-rename/actions/workflows/test.yml)
[![license](https://img.shields.io/github/license/lmst2/dsh-rename.svg)](LICENSE)

A DeepSeek Harness session-rename plugin: it adds a **`/rename` slash command** to the current conversation. Pass a name to rename directly; pass nothing and the model reads the conversation, summarizes a title, and renames the session.

## Why a command instead of another auto-renamer

DeepSeek Harness already ships automatic session naming: the base bundle mounts `session-title-first-prompt-llm`, which generates a title through `ctx.sessionTitle` from the first prompt. There is no reason to duplicate that. This plugin adds the missing piece — **one-command rename, with the model picking the name on demand**.

## Install

**Prerequisites**: [DeepSeek Harness](https://github.com/deepseek-ai/DeepSeek-Harness) with the `dsh` command available; Node.js `^22.19` or `>=24`; pnpm 11.

Install from GitHub:

```sh
dsh plugin --profile web add github:lmst2/dsh-rename
```

`dsh plugin` pnpm-installs the package into the `web` profile and reconciles its `dsh.bundle` declaration into the profile composition. Restart the running DeepSeek Harness Web service and refresh the page; `/rename` then appears in the slash-command menu.

> **Restart required**: the plugin row becomes active on the next boot of that profile.

Confirm the install with `dsh plugin --profile web list`.

### Other install methods

**Local source** (rebuild after changes; host-side changes require a service restart):

```sh
git clone https://github.com/lmst2/dsh-rename.git
cd dsh-rename
pnpm install
pnpm build
dsh plugin --profile web add "link:$(pwd)"
```

**A specific GitHub branch**:

```sh
dsh plugin --profile web add github:lmst2/dsh-rename#main
```

## Usage

In the current session, type:

```text
/rename
```

The plugin collects the visible conversation (direct user prompts plus assistant replies), issues one auxiliary model request with `purpose: session-title`, and renames the session to the generated title.

With an explicit name, no model call happens:

```text
/rename Refactor session title service
```

Both paths commit through the built-in `ctx.sessionTitle.rename` as a `session/title` event (`source: user`), so:

- the new title appears immediately in the sidebar/session list;
- the title is pinned, so built-in automatic naming will not overwrite it;
- the plugin writes no custom session events, so sessions renamed through it remain readable by any DSH build even after the plugin is uninstalled.

## Configuration

The bundle patch ships with no config row, so defaults apply. To override, target the `dsh-rename` row in the profile's `cordis.patch.yml`:

```yaml
- id: dsh-rename
  config:
    targetWords: 6
    targetCjkCharacters: 12
    maxInputBytes: 32768
    maxOutputTokens: 64
    maxTitleBytes: 80
    timeoutMs: 60000
    provider: deepseek-official
    model: deepseek-v4-flash
```

| Field | Default | Meaning |
| --- | --- | --- |
| `targetWords` | `6` | Target word count for non-CJK generated titles |
| `targetCjkCharacters` | `12` | Target character count for CJK generated titles |
| `maxInputBytes` | `32768` | Maximum UTF-8 bytes of the transcript framed for the title model |
| `maxOutputTokens` | `64` | Auxiliary generation output-token cap |
| `maxTitleBytes` | `80` | Maximum UTF-8 bytes of any accepted title |
| `timeoutMs` | `60000` | End-to-end auxiliary request deadline in milliseconds |
| `provider` / `model` | unset | Optional explicit model route; otherwise the session's latest logged `request/header` route is used |

`provider` and `model` must be supplied together; a half-configured pair fails loudly at load.

## How it works

1. `/rename` is dispatched by the `@deepseek-ai/dsh-commands` slash-command registry and never enters the model context.
2. An explicit name calls `ctx.sessionTitle.rename` directly.
3. Without a name, the plugin collects direct user messages and assistant replies from `session.events` (synthetic context, reasoning, and tool results are skipped), keeps the newest entries within the byte budget, and issues one auxiliary `purpose: session-title` call through `ctx.llm.stream`.
4. The model output is normalized with `normalizeSessionTitle`, capped at `maxTitleBytes`, and committed through `ctx.sessionTitle.rename`.
5. Registration is an effect: disposing the plugin fiber unregisters `/rename`, so runtime replacement is safe.

## Development

```sh
pnpm install     # install dependencies
pnpm typecheck   # strict type checking
pnpm test        # vitest unit tests
pnpm build       # tsc emits lib/types
pnpm verify      # typecheck + test + build + publish smoke check
```

Keep `pnpm verify` green before committing.

## Documentation

| Document | Contents |
| --- | --- |
| [docs/usage.md](docs/usage.md) | Configuration, command semantics, error handling, and known limitations |
| [AGENTS.md](AGENTS.md) | Repository layout and development conventions |

## License

[MIT](LICENSE) © dsh-rename contributors
