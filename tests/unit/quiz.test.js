import { describe, it } from 'node:test'
import assert from 'node:assert'
import quizQuestions from '../../src/data/quiz.json' with { type: 'json' }
import {
  calculateQuizScore,
  evaluateQuizComparison,
  buildQuizAnalyticsPayload,
  shuffleQuestions
} from '../../src/utils/quizAnalytics.js'

describe('Quiz & Learning Layer (P2-01, P2-03, P2-04)', () => {
  it('P2-01: contains at least 5 structured questions with source IDs, explanations, and single correct answer', () => {
    assert.ok(quizQuestions.length >= 5, 'Must contain at least 5 questions')
    for (const q of quizQuestions) {
      assert.ok(q.id, 'Question must have id')
      assert.ok(q.concept, 'Question must map to a concept')
      assert.ok(q.question, 'Question must have text')
      assert.ok(q.source, 'Question must have source ID')
      assert.ok(q.explanation, 'Question must have explanation')
      assert.ok(q.explanation.includes('(game estimate)'), 'Explanation must include (game estimate)')
      assert.ok(Array.isArray(q.options) && q.options.length >= 3, 'Must have at least 3 options')
      const correctOptions = q.options.filter((o) => o.isCorrect)
      assert.strictEqual(correctOptions.length, 1, 'Must have exactly 1 correct option')
    }
  })

  it('P2-03: accurately calculates score and concept improvements between pre and post checks', () => {
    // Simulated pre-answers (2 correct out of 5)
    const preAnswers = {
      quiz_q1_soil_microbes: 'opt_b', // incorrect
      quiz_q2_happy_seeder: 'opt_b',  // correct
      quiz_q3_bio_decomposer: 'opt_a', // incorrect
      quiz_q4_pm25_health: 'opt_a',   // correct
      quiz_q5_biomass_economy: 'opt_c' // incorrect
    }

    // Simulated post-answers (5 correct out of 5)
    const postAnswers = {
      quiz_q1_soil_microbes: 'opt_a', // correct (learned!)
      quiz_q2_happy_seeder: 'opt_b',  // correct (retained)
      quiz_q3_bio_decomposer: 'opt_c', // correct (learned!)
      quiz_q4_pm25_health: 'opt_a',   // correct (retained)
      quiz_q5_biomass_economy: 'opt_b' // correct (learned!)
    }

    const evalResult = evaluateQuizComparison({
      preAnswers,
      postAnswers,
      questions: quizQuestions
    })

    assert.strictEqual(evalResult.preScore, 2)
    assert.strictEqual(evalResult.postScore, 5)
    assert.strictEqual(evalResult.delta, +3)
    assert.strictEqual(evalResult.improved, true)
    assert.strictEqual(evalResult.conceptsLearned.length, 3)
    assert.ok(evalResult.feedbackMessage.includes('+3 points'))
  })

  it('P2-03: gives honest message without blame when there is no improvement', () => {
    const preAnswers = { quiz_q1_soil_microbes: 'opt_a' }
    const postAnswers = { quiz_q1_soil_microbes: 'opt_b' }

    const evalResult = evaluateQuizComparison({
      preAnswers,
      postAnswers,
      questions: quizQuestions
    })

    assert.strictEqual(evalResult.delta, -1)
    assert.strictEqual(evalResult.improved, false)
    assert.ok(
      evalResult.feedbackMessage.includes('Nothing wrong here, try the comparison again'),
      'Must offer supportive, honest phrasing per S10 specification'
    )
  })

  it('P2-04: formats structured anonymous learning analytics payload matching schema', () => {
    const payload = buildQuizAnalyticsPayload({
      sessionId: 'test_session_123',
      classCode: 'PUNJAB9',
      preSession: { answers: { quiz_q1_soil_microbes: 'opt_a' }, durationMs: 14000, skipped: false },
      postSession: { answers: { quiz_q1_soil_microbes: 'opt_a', quiz_q2_happy_seeder: 'opt_b' }, durationMs: 11000, skipped: false },
      questions: quizQuestions
    })

    assert.strictEqual(payload.sessionId, 'test_session_123')
    assert.strictEqual(payload.classCode, 'PUNJAB9')
    assert.strictEqual(typeof payload.timestamp, 'string')
    assert.strictEqual(payload.preCheck.score, 1)
    assert.strictEqual(payload.postCheck.score, 2)
    assert.strictEqual(payload.delta, 1)
    assert.ok(Array.isArray(payload.conceptsLearned))
    assert.strictEqual(payload.status, 'complete')
  })

  it('shuffles questions cleanly without mutating the question set', () => {
    const shuffled = shuffleQuestions(quizQuestions, 42)
    assert.strictEqual(shuffled.length, quizQuestions.length)
    assert.strictEqual(new Set(shuffled.map((q) => q.id)).size, quizQuestions.length)
  })
})
