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
import { SessionTitleInvalidError } from '@deepseek-ai/dsh-session-title';
import { ConfigSchema, resolveConfig } from "./config.js";
import { generateSessionTitle } from "./title.js";
export const name = 'dsh-rename';
export const inject = ['commands', 'sessionTitle', 'llm'];
/** Loader schema. */
export const Config = ConfigSchema;
const USAGE = 'Usage: /rename [<name>]';
/** Render the accepted title and link the command card to its title event. */
function renameResult(snapshot, generated) {
    const text = generated
        ? `Renamed this session to "${snapshot.title}" — the name was generated from the conversation.`
        : `Session renamed to "${snapshot.title}".`;
    return { kind: 'success', text, sourceEventSeq: snapshot.eventSeq };
}
/** Error text extraction that never trusts `String` coercion of a thrown value. */
function errorText(error) {
    return error instanceof Error ? error.message : String(error);
}
/** Rename with an explicit human name; only input validation becomes a soft command error. */
function renameExplicit(ctx, invocation, requested) {
    try {
        return renameResult(ctx.sessionTitle.rename(invocation.agent.session, requested), false);
    }
    catch (error) {
        if (error instanceof SessionTitleInvalidError) {
            return { kind: 'error', text: `The session name must contain visible characters. ${USAGE}` };
        }
        throw error;
    }
}
/** Generate a title from the current conversation, then rename; generation failures are user-facing errors. */
async function renameGenerated(ctx, config, invocation) {
    const session = invocation.agent.session;
    try {
        const generated = await generateSessionTitle(ctx, config, session, invocation.signal);
        const current = ctx.sessionTitle.get(session);
        if (current?.title === generated) {
            return {
                kind: 'success',
                text: `The session is already named "${current.title}".`,
                sourceEventSeq: current.eventSeq,
            };
        }
        return renameResult(ctx.sessionTitle.rename(session, generated), true);
    }
    catch (error) {
        if (invocation.signal.aborted)
            throw error;
        return { kind: 'error', text: `Could not generate a session name: ${errorText(error)}` };
    }
}
/** Parse and execute one `/rename` command without sending it to the model. */
function executeRename(ctx, config, invocation) {
    const requested = invocation.rawInput.trim();
    if (requested.length > 0)
        return renameExplicit(ctx, invocation, requested);
    return renameGenerated(ctx, config, invocation);
}
/**
 * Register the global `/rename` command for every composed command adapter.
 * Registration is an effect: disposing the plugin fiber unregisters the command.
 * @param ctx - host context carrying the command, session-title, and LLM services.
 * @param config - validated optional policy; see {@link Config}.
 */
export function apply(ctx, config) {
    const resolved = resolveConfig(config);
    ctx.effect(() => ctx.commands.register({
        name: 'rename',
        description: 'rename this session, or let the model read the conversation and pick a name',
        input: { hint: '[<name>]' },
        recordInput: false,
        handler: invocation => executeRename(ctx, resolved, invocation),
    }), 'dsh-rename: /rename command');
}
//# sourceMappingURL=index.js.map