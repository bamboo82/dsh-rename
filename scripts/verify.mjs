// Release smoke check: the built host entry is loadable, exports the Cordis
// function-plugin protocol, and the bundle patch names the same package as
// package.json. Run after `pnpm build`.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
const entry = new URL('../lib/types/index.js', import.meta.url)
const mod = await import(entry.href)

assert.equal(mod.name, 'dsh-rename', 'built entry must export plugin name')
assert.deepEqual(mod.inject, ['commands', 'sessionTitle', 'llm'])
assert.ok(
  typeof mod.Config === 'object' || typeof mod.Config === 'function',
  'built entry must export the Config schema',
)
assert.equal(typeof mod.apply, 'function', 'built entry must export apply()')

const patch = await readFile(new URL('../cordis.patch.yml', import.meta.url), 'utf8')
assert.match(patch, /id:\s*dsh-rename/u)
assert.match(patch, new RegExp(`name:\\s*${pkg.name}\\b`, 'u'), 'bundle patch row name must equal package name')
assert.equal(pkg.dsh.bundle.patch, './cordis.patch.yml')

console.log('verify: built entry and bundle patch are publishable')
