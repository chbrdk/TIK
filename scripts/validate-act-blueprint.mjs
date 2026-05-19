#!/usr/bin/env node
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const schema = JSON.parse(
  readFileSync(join(ROOT, 'act_blueprint.v1.schema.json'), 'utf-8'),
)
const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)
const validate = ajv.compile(schema)

const set = process.argv[2] ?? 'product-default'
const dir = join(ROOT, 'fixtures/act-blueprints', set)
const files = readdirSync(dir).filter((f) => f.endsWith('.json'))

let failed = 0
for (const file of files) {
  const data = JSON.parse(readFileSync(join(dir, file), 'utf-8'))
  if (!validate(data)) {
    console.error(`FAIL ${file}:`, validate.errors)
    failed++
  } else {
    console.log(`OK ${file}`)
  }
}

process.exit(failed ? 1 : 0)
