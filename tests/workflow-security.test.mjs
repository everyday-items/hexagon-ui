import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const immutableAction = /^[^\s#]+@[0-9a-f]{40}(?:\s*#.*)?$/
const mutableRunner = /\b(?:ubuntu|macos|windows)-latest\b/

test('CI dependencies are immutable', () => {
  const workflowsDir = join(root, '.github', 'workflows')
  const workflows = readdirSync(workflowsDir).filter((name) => /\.ya?ml$/.test(name))
  assert.ok(workflows.length > 0, 'no GitHub Actions workflows found')

  for (const workflow of workflows) {
    const lines = readFileSync(join(workflowsDir, workflow), 'utf8').split('\n')
    for (const [index, rawLine] of lines.entries()) {
      const line = rawLine.trim()
      if (!line || line.startsWith('#')) continue
      if (line.startsWith('uses:') || line.startsWith('- uses:')) {
        const actionLine = line.startsWith('- ') ? line.slice(2) : line
        const ref = actionLine.slice('uses:'.length).trim()
        if (!ref.startsWith('./')) {
          assert.match(ref, immutableAction, `${workflow}:${index + 1}: mutable action ${ref}`)
        }
      }
      assert.doesNotMatch(line, mutableRunner, `${workflow}:${index + 1}: mutable runner ${line}`)
      assert.ok(
        !(line.includes('go install ') && line.includes('@latest')),
        `${workflow}:${index + 1}: mutable Go tool ${line}`,
      )
    }
  }
})
