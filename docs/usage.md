# dsh-rename usage reference

This document is the authoritative description of `dsh-rename` behavior.
`README.md` keeps the quick install-and-try path; details live here.

## Scope

`dsh-rename` registers exactly one global slash command, `/rename`, and adds
no tools, prompt sections, session events, or files. It deliberately does not
register a session-title provider: DeepSeek Harness already mounts
`session-title-first-prompt-llm` in the base bundle, which owns automatic
naming. Installing this plugin therefore never conflicts with that provider
and never changes existing auto-naming behavior.

## Command semantics

| Input | Behavior |
| --- | --- |
| `/rename <name>` | Normalize and commit `<name>` through `ctx.sessionTitle.rename`. No model call. |
| `/rename` (or whitespace after the name) | Generate one title from the current conversation, then commit it through `ctx.sessionTitle.rename`. |
| Explicit name that normalizes to empty | Command error with the usage line. No `session/title` event is appended. |
| Generated title equal to the current title | Success without appending a duplicate `session/title` event. |
| Generation failure | Command error containing the failure message. No `session/title` event is appended. |

`rawInput` is intentionally not recorded in `command/run`
(`recordInput: false`): the durable `session/title` event owns the payload,
and the `command/done` success result links back to it through
`sourceEventSeq`.

## Transcript collection

For a model-generated name, the plugin walks `session.events` in log order and
keeps:

- `user/message` events whose `source.kind === 'user'`, text blocks only;
- `assistant/message` events, text blocks only.

The following stay out of the transcript: synthetic/plugin user messages,
reasoning blocks, image blocks, tool calls, tool results, raw chunks, and
boundary markers. Visible text is joined per message and trimmed.

The collected entries are then fitted into `maxInputBytes`:

1. Whole oldest entries are dropped until the JSON-framed transcript fits.
2. If a single oversized entry remains, its text is truncated on code-point
   boundaries and an ellipsis is appended.

A session with no visible conversation text fails the command with a clear
error before any model dispatch.

## Model call

The auxiliary call uses `ctx.llm.stream` with:

- `purpose: 'session-title'`;
- the explicit `provider`/`model` config pair when set, otherwise the
  session's latest logged `request/header` route;
- a stable system prompt that asks for one plain-text line in the
  conversation's language;
- `maxTokens: maxOutputTokens`;
- a combined caller signal and `timeoutMs` deadline.

The output is assembled with `BlockAssembler`, must be text-only, and is
sanitized with `normalizeSessionTitle` plus `maxTitleBytes`.

## Title durability

The plugin never appends `session/title` itself. Both paths call
`ctx.sessionTitle.rename`, so the resulting event carries
`source: { kind: 'user' }`. That pins the title: later user prompts no longer
schedule the built-in automatic provider for that session. This is the same
semantics as the web UI's rename action.

## Configuration

See the table in `README.md`. Validation happens twice by design: the exported
schemastery schema is the Loader boundary, and `resolveConfig` validates direct
`ctx.plugin(dshRename, config)` calls. Unknown keys, non-positive integers,
and a half-configured provider/model pair fail at load.

## Error handling

- Command-usage errors (empty-normalizing explicit name, no transcript,
  generation failure) return `{ kind: 'error', text }` so the UI renders a
  normal command card.
- Cancellation rethrows: an aborted UI request keeps its abort semantics.
- Provider/transport failures surface inside the command error text.

## Known limitations

- The transcript is bounded by `maxInputBytes`; in very long conversations the
  oldest context is dropped first. The first-prompt title remains available
  from the built-in provider, and an explicit `/rename <name>` never depends
  on context.
- Tool activity is not transcribed. Titles are derived from visible user and
  assistant text, which is intentional to keep the auxiliary call small and
  predictable.
- The generated-title call runs synchronously inside the slash-command
  request, so `/rename` without a name waits for the model call before
  rendering its command card.
