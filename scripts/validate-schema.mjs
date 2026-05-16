#!/usr/bin/env node
/**
 * Validates golden scene_config fixtures against scene_config.v1.schema.json.
 * Usage: node scripts/validate-schema.mjs [path-to-json...]
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

async function main() {
  const Ajv = (await import('ajv')).default;
  const addFormats = (await import('ajv-formats')).default;

  const schemaPath = join(root, 'scene_config.v1.schema.json');
  const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));

  const ajv = new Ajv({ allErrors: true, strict: false, validateSchema: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);

  const args = process.argv.slice(2);
  const files =
    args.length > 0
      ? args.map((f) => resolve(f))
      : readdirSync(join(root, 'fixtures/golden'))
          .filter((f) => f.endsWith('.json'))
          .map((f) => join(root, 'fixtures/golden', f));

  let failed = 0;
  for (const file of files) {
    const data = JSON.parse(readFileSync(file, 'utf8'));
    const ok = validate(data);
    if (ok) {
      console.log(`✓ ${file}`);
    } else {
      failed++;
      console.error(`✗ ${file}`);
      for (const err of validate.errors ?? []) {
        console.error(`  ${err.instancePath || '/'}: ${err.message}`);
      }
    }
    validate.errors = null;
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
