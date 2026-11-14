import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const translationsPath = path.resolve(__dirname, '../../src/data/translations.json');
const translations = JSON.parse(fs.readFileSync(translationsPath, 'utf8'));

describe('Translations & Parity (P5-01, P5-02, P5-03)', () => {
  it('supports en, te, and hi top-level languages', () => {
    assert.ok(translations.en, 'Missing en');
    assert.ok(translations.te, 'Missing te');
    assert.ok(translations.hi, 'Missing hi');
  });

  it('guarantees 100% key parity between en, te, and hi with zero missing keys', () => {
    function getKeys(obj, prefix = '') {
      let keys = [];
      for (const [k, v] of Object.entries(obj)) {
        const full = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          keys = keys.concat(getKeys(v, full));
        } else {
          keys.push(full);
        }
      }
      return keys;
    }

    const enKeys = new Set(getKeys(translations.en));
    const teKeys = new Set(getKeys(translations.te));
    const hiKeys = new Set(getKeys(translations.hi));

    assert.strictEqual(enKeys.size, teKeys.size, `Expected te to have ${enKeys.size} keys, got ${teKeys.size}`);
    assert.strictEqual(enKeys.size, hiKeys.size, `Expected hi to have ${enKeys.size} keys, got ${hiKeys.size}`);

    for (const key of enKeys) {
      assert.ok(teKeys.has(key), `te is missing key: ${key}`);
      assert.ok(hiKeys.has(key), `hi is missing key: ${key}`);
    }
  });

  it('contains expected cultural & domain agricultural terms in Telugu and Hindi', () => {
    assert.ok(translations.te.game3d.choiceBurn.includes('కాల్చడం'), 'Telugu choiceBurn mismatch');
    assert.ok(translations.te.game3d.choiceHappySeeder.includes('హ్యాపీ సీడర్'), 'Telugu Happy Seeder mismatch');
    assert.ok(translations.hi.game3d.choiceBurn.includes('जलाना'), 'Hindi choiceBurn mismatch');
    assert.ok(translations.hi.game3d.choiceHappySeeder.includes('हैप्पी सीडर'), 'Hindi Happy Seeder mismatch');
  });
});
