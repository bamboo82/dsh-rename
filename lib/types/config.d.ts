/**
 * Deployment policy for the `/rename` command.
 *
 * Every tunable has a validated default so the bundle patch can stay minimal;
 * a profile overlay may override any field through the plugin row's `config`.
 * @module dsh-rename/config
 */
import z from '@deepseek-ai/schemastery';
/** User-overridable plugin configuration. */
export interface Config {
    /** Target word count for non-CJK generated titles (default `6`). */
    targetWords?: number;
    /** Target character count for CJK generated titles (default `12`). */
    targetCjkCharacters?: number;
    /** Maximum UTF-8 bytes of the transcript framed for the title model (default `32768`). */
    maxInputBytes?: number;
    /** Auxiliary generation output-token cap (default `64`). */
    maxOutputTokens?: number;
    /** Maximum UTF-8 bytes of any accepted title (default `80`). */
    maxTitleBytes?: number;
    /** End-to-end auxiliary request deadline in milliseconds (default `60000`). */
    timeoutMs?: number;
    /** Optional explicit provider route; must be paired with `model`. */
    provider?: string;
    /** Optional explicit model id; must be paired with `provider`. */
    model?: string;
}
/** Loader schema with library-owned defaults; no field is required. */
export declare const ConfigSchema: z<Config>;
/** Immutable resolved policy consumed by the command and title generator. */
export interface ResolvedConfig {
    readonly targetWords: number;
    readonly targetCjkCharacters: number;
    readonly maxInputBytes: number;
    readonly maxOutputTokens: number;
    readonly maxTitleBytes: number;
    readonly timeoutMs: number;
    readonly provider?: string;
    readonly model?: string;
}
/**
 * Validate and detach one plugin configuration into immutable policy.
 *
 * The Loader already applies the exported schema defaults before `apply`;
 * this pass still runs so a direct `ctx.plugin(dshRename, config)` call gets
 * identical behavior and cannot smuggle unknown keys past the public entry.
 * @param input - untrusted plugin configuration, possibly undefined.
 * @returns frozen resolved policy with every default materialized.
 */
export declare function resolveConfig(input: Config | undefined): ResolvedConfig;
//# sourceMappingURL=config.d.ts.map