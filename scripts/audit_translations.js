import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const translationsPath = path.resolve(__dirname, '../src/data/translations.json');
const translations = JSON.parse(fs.readFileSync(translationsPath, 'utf8'));

const languages = ['en', 'te', 'hi'];

function getLeafKeys(obj, prefix = '') {
  let leaves = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      leaves = leaves.concat(getLeafKeys(value, fullKey));
    } else {
      leaves.push(fullKey);
    }
  }
  return leaves;
}

console.log('--- AUDITING TRANSLATIONS ---');

const enKeys = new Set(getLeafKeys(translations.en));
console.log(`Base language [en] has ${enKeys.size} leaf keys.`);

let errors = 0;

for (const lang of ['te', 'hi']) {
  if (!translations[lang]) {
    console.error(`ERROR: Missing complete language block for [${lang}]`);
    errors++;
    continue;
  }

  const langKeys = new Set(getLeafKeys(translations[lang]));
  console.log(`Checking [${lang}]... Total keys found: ${langKeys.size}`);

  const missingInLang = [...enKeys].filter(k => !langKeys.has(k));
  const extraInLang = [...langKeys].filter(k => !enKeys.has(k));

  if (missingInLang.length > 0) {
    console.error(`ERROR: [${lang}] is missing ${missingInLang.length} keys:`);
    missingInLang.forEach(k => console.error(`  - ${k}`));
    errors += missingInLang.length;
  }

  if (extraInLang.length > 0) {
    console.warn(`WARNING: [${lang}] has ${extraInLang.length} extra keys not in [en]:`);
    extraInLang.forEach(k => console.warn(`  + ${k}`));
  }

  // Check for empty string values
  function checkEmpty(obj, prefix = '') {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        checkEmpty(value, fullKey);
      } else if (typeof value === 'string' && value.trim() === '') {
        console.error(`ERROR: [${lang}] has empty string at ${fullKey}`);
        errors++;
      }
    }
  }
  checkEmpty(translations[lang]);
}

if (errors === 0) {
  console.log('SUCCESS: All languages (en, te, hi) have 100% key parity with 0 missing keys.');
  process.exit(0);
} else {
  console.error(`AUDIT FAILED: ${errors} errors found in translations.`);
  process.exit(1);
}
