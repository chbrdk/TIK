#!/usr/bin/env node
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const schema = JSON.parse(readFileSync(join(ROOT, 'persona_inputs.v1.schema.json'), 'utf-8'))
const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)
const validate = ajv.compile(schema)

const file = process.argv[2]
const files = file
  ? [file]
  : readdirSync(join(ROOT, 'fixtures/persona-inputs')).filter((f) => f.endsWith('.json'))

let failed = 0
for (const f of files) {
  const path = file ? f : join(ROOT, 'fixtures/persona-inputs', f)
  const data = JSON.parse(readFileSync(path, 'utf-8'))
  if (!validate(data)) {
    console.error(`FAIL ${f}:`, validate.errors)
    failed++
  } else {
    console.log(`OK ${f}`)
  }
}
process.exit(failed ? 1 : 0)
