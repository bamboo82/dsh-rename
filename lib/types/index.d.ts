/**
 * `dsh-rename` — the `/rename` slash command for DeepSeek Harness.
 *
 * DeepSeek Harness already mounts its own automatic session-title provider
 * (`session-title-first-prompt-llm` in the base bundle), so this plugin adds
 * no second auto-naming path. It fills the missing human command:
 *
 * - `/rename <name>` renames the current session immediately;
 * - `/rename` without a name asks the model to read the current conversation
 *   and produce a title, then renames the session to that title.
 *
 * Every rename is committed by `ctx.sessionTitle.rename` as the built-in
 * `session/title` event (user source), which also pins the title against
 * further automatic regeneration. The plugin writes no custom session events,
 * so sessions renamed through it stay readable by any DSH build.
 *
 * Installation: `dsh plugin --profile <name> add dsh-rename`.
 * @module dsh-rename
 */
import type { Context } from '@deepseek-ai/cordis';
import type { Config as ConfigModel } from './config.ts';
/** User-overridable plugin configuration (the type companion of {@link Config}). */
export type Config = ConfigModel;
export type { ResolvedConfig } from './config.ts';
export declare const name = "dsh-rename";
export declare const inject: string[];
/** Loader schema. */
export declare const Config: import("@deepseek-ai/schemastery").default<ConfigModel>;
/**
 * Register the global `/rename` command for every composed command adapter.
 * Registration is an effect: disposing the plugin fiber unregisters the command.
 * @param ctx - host context carrying the command, session-title, and LLM services.
 * @param config - validated optional policy; see {@link Config}.
 */
export declare function apply(ctx: Context, config?: Config): void;
//# sourceMappingURL=index.d.ts.map