import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getOfflineAnswer, OFFLINE_KNOWLEDGE } from '../../src/data/aiOfflineKnowledge.js';

describe('AI Advisor Offline Knowledge (P6-01, P6-02, P6-03)', () => {
  it('contains verified knowledge items with en, te, and hi translations', () => {
    assert.ok(OFFLINE_KNOWLEDGE.length >= 3, 'Should have at least 3 knowledge items');
    for (const item of OFFLINE_KNOWLEDGE) {
      assert.ok(item.keywords && item.keywords.length > 0, 'Keywords must exist');
      assert.ok(item.answer.en, 'English answer must exist');
      assert.ok(item.answer.te, 'Telugu answer must exist');
      assert.ok(item.answer.hi, 'Hindi answer must exist');
    }
  });

  it('matches straw questions in English, Telugu, and Hindi', () => {
    const ansEn = getOfflineAnswer('What can I do with my crop stubble?', 'en');
    assert.ok(ansEn.includes('Happy Seeder'), 'En should mention Happy Seeder');

    const ansTe = getOfflineAnswer('వరి గడ్డిని ఎలా ఉపయోగించాలి?', 'te');
    assert.ok(ansTe.includes('హ్యాపీ సీడర్'), 'Te should mention Happy Seeder');

    const ansHi = getOfflineAnswer('धान की पराली का क्या करें?', 'hi');
    assert.ok(ansHi.includes('हैप्पी सीडर'), 'Hi should mention Happy Seeder');
  });

  it('matches plastic bottle questions across languages', () => {
    const ansEn = getOfflineAnswer('How to reuse plastic bottle?', 'en');
    assert.ok(ansEn.includes('Planters') || ansEn.includes('Scrap'), 'En bottle match');

    const ansHi = getOfflineAnswer('प्लास्टिक बोतल का क्या करें?', 'hi');
    assert.ok(ansHi.includes('गमले') || ansHi.includes('कबाड़ीवाले'), 'Hi bottle match');
  });

  it('returns appropriate language fallback for unmatched queries', () => {
    const fallbackEn = getOfflineAnswer('random unmapped query', 'en');
    assert.ok(fallbackEn.includes('Source Segregation'), 'En generic fallback');

    const fallbackTe = getOfflineAnswer('random unmapped query', 'te');
    assert.ok(fallbackTe.includes('వర్గీకరించండి'), 'Te generic fallback');

    const fallbackHi = getOfflineAnswer('random unmapped query', 'hi');
    assert.ok(fallbackHi.includes('पृथक्करण'), 'Hi generic fallback');
  });
});
